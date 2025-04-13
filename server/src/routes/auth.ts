import express, { Request, Response, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { authenticateToken } from '../middleware/auth';
import { jwtDecode } from 'jwt-decode';

// Create router instance
const router = express.Router();

// Sign up route
router.post('/signup', (async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
}) as RequestHandler);

// Login route
router.post('/login', (async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Verify password
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
}) as RequestHandler);

// Get user profile route (protected)
router.get('/me', 
  authenticateToken as RequestHandler,
  (async (req: Request, res: Response) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Server error getting user profile' });
    }
  }) as RequestHandler);

// Google authentication route
router.post('/google', (async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    // Parse the JWT token using jwt-decode
    const payload = jwtDecode(token);
    // Extract user info from the payload
    const { email, name, sub: googleId } = payload as { 
      email: string; 
      name: string; 
      sub: string;
    };
    
    console.log("Google auth attempt for:", email);
    
    // Check if user already exists
    let user = await User.findByEmail(email);
    
    if (!user) {
      // Create new user if not exists
      console.log("Creating new user for Google auth:", email);
      user = await User.createWithGoogle({
        name,
        email,
        googleId
      });
    } else {
      console.log("Existing user found for Google auth:", email);
    }
    
    // Generate JWT token for your app
    const appToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Google authentication successful',
      token: appToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
}) as RequestHandler);

export default router;

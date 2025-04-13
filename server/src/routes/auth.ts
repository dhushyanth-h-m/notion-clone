import express, { Request, Response, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';
import { jwtDecode } from 'jwt-decode';
import bcryptjs from 'bcryptjs';
import { Pool } from 'pg';

// Database connection
const connectionString = `postgres://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgres'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'notion_clone'}`;
const pool = new Pool({ connectionString });

// Create router instance
const router = express.Router();

// User DB methods
const UserDB = {
  async findByEmail(email: string) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  },

  async findById(id: number) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },

  async create(userData: { name: string, email: string, password: string }) {
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(userData.password, salt);

    const query = `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [userData.name, userData.email, hashedPassword];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async createWithGoogle(userData: { name: string, email: string, googleId: string }) {
    const randomPassword = Math.random().toString(36).slice(-8);
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(randomPassword, salt);
    
    const query = `
      INSERT INTO users (name, email, password, google_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [userData.name, userData.email, hashedPassword, userData.googleId];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async comparePassword(password: string, hashedPassword: string) {
    return bcryptjs.compare(password, hashedPassword);
  }
};

// Sign up route
router.post('/signup', (async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await UserDB.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Create new user
    const user = await UserDB.create({
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
    const user = await UserDB.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Verify password
    const isMatch = await UserDB.comparePassword(password, user.password);
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
      const user = await UserDB.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove password from response
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
      
      res.json(userData);
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
    let user = await UserDB.findByEmail(email);
    
    if (!user) {
      // Create new user if not exists
      console.log("Creating new user for Google auth:", email);
      user = await UserDB.createWithGoogle({
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

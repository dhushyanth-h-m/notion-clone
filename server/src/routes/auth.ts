import express, { Request, Response, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';
import { jwtDecode } from 'jwt-decode';
import bcryptjs from 'bcryptjs';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// Database connection
// Force Docker mode when running in container
process.env.RUNNING_IN_DOCKER = 'true';
const isRunningInDocker = true;
// When running locally, connect to "localhost" for the host
// When in Docker, connect to "postgres" container name
const dbHost = 'postgres';

console.log(`Connecting to PostgreSQL at ${dbHost}:${process.env.POSTGRES_PORT || '5432'}`);

const connectionString = `postgres://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgres'}@${dbHost}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'notion_clone'}`;
console.log(`Connection string: ${connectionString}`);

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

  async findById(id: string) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },

  async create(userData: { name: string, email: string, password: string }) {
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(userData.password, salt);
    
    // Generate UUID for user
    const userId = uuidv4();
    
    console.log("Creating regular user with UUID:", userId);

    const query = `
      INSERT INTO users (id, name, email, password, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    try {
      // Use a transaction to ensure atomicity
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        const values = [userId, userData.name, userData.email, hashedPassword];
        console.log("Insert values:", JSON.stringify(values));
        
        const result = await client.query(query, values);
        await client.query('COMMIT');
        
        console.log("User created successfully:", result.rows[0].id);
        return result.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        console.error("Transaction error:", error);
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Database error in create:", error);
      throw error;
    }
  },

  async createWithGoogle(userData: { name: string, email: string, googleId: string }) {
    const randomPassword = Math.random().toString(36).slice(-8);
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(randomPassword, salt);
    
    // Generate a valid UUID for the user
    const userId = uuidv4();
    
    console.log("Creating user with UUID:", userId);
    
    // Build an SQL query that explicitly sets timestamps
    const query = `
      INSERT INTO users 
      (id, name, email, password, google_id, created_at, updated_at)
      VALUES 
      ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    
    // Log everything for debugging
    console.log("Query:", query);
    
    try {
      // Use a transaction to ensure atomicity
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        const values = [userId, userData.name, userData.email, hashedPassword, userData.googleId];
        console.log("Insert values:", JSON.stringify(values));
        
        const result = await client.query(query, values);
        
        // Log the result row to verify what was actually inserted
        console.log("Insert result:", JSON.stringify(result.rows[0]));
        
        await client.query('COMMIT');
        
        console.log("User created successfully:", result.rows[0].id);
        return result.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        console.error("Transaction error:", error);
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Database error in createWithGoogle:", error);
      throw error;
    }
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
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
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
      
      try {
        user = await UserDB.createWithGoogle({
          name,
          email,
          googleId
        });
        
        console.log("New user created with ID:", user.id);
      } catch (dbError: any) {
        console.error("Database error during user creation:", dbError);
        // Send more detailed error for debugging
        return res.status(500).json({ 
          message: 'Failed to create user account', 
          error: dbError.message || 'Unknown database error',
          code: dbError.code
        });
      }
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

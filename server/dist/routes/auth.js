"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const jwt_decode_1 = require("jwt-decode");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const pg_1 = require("pg");
const uuid_1 = require("uuid");
// Database connection
const isRunningInDocker = process.env.RUNNING_IN_DOCKER === 'true';
// When running locally, connect to "localhost" for the host
// When in Docker, connect to "postgres" container name
const dbHost = isRunningInDocker ?
    (process.env.POSTGRES_HOST || 'postgres') :
    'localhost';
console.log(`Connecting to PostgreSQL at ${dbHost}:${process.env.POSTGRES_PORT || '5432'}`);
const connectionString = `postgres://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgres'}@${dbHost}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'notion_clone'}`;
const pool = new pg_1.Pool({ connectionString });
// Create router instance
const router = express_1.default.Router();
// User DB methods
const UserDB = {
    async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0] || null;
    },
    async findById(id) {
        const query = 'SELECT * FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    },
    async create(userData) {
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(userData.password, salt);
        // Generate UUID for user
        const userId = (0, uuid_1.v4)();
        console.log("Creating regular user with UUID:", userId);
        const query = `
      INSERT INTO users (id, name, email, password)
      VALUES ($1, $2, $3, $4)
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
            }
            catch (error) {
                await client.query('ROLLBACK');
                console.error("Transaction error:", error);
                throw error;
            }
            finally {
                client.release();
            }
        }
        catch (error) {
            console.error("Database error in create:", error);
            throw error;
        }
    },
    async createWithGoogle(userData) {
        const randomPassword = Math.random().toString(36).slice(-8);
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(randomPassword, salt);
        // Generate a valid UUID for the user
        const userId = (0, uuid_1.v4)();
        console.log("Creating Google user with UUID:", userId);
        // Explicitly set the query with return
        const query = `
      INSERT INTO users (id, name, email, password, google_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
        try {
            // Use a transaction to ensure atomicity
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                const values = [userId, userData.name, userData.email, hashedPassword, userData.googleId];
                console.log("Insert values:", JSON.stringify(values));
                const result = await client.query(query, values);
                await client.query('COMMIT');
                console.log("User created successfully:", result.rows[0].id);
                return result.rows[0];
            }
            catch (error) {
                await client.query('ROLLBACK');
                console.error("Transaction error:", error);
                throw error;
            }
            finally {
                client.release();
            }
        }
        catch (error) {
            console.error("Database error in createWithGoogle:", error);
            throw error;
        }
    },
    async comparePassword(password, hashedPassword) {
        return bcryptjs_1.default.compare(password, hashedPassword);
    }
};
// Sign up route
router.post('/signup', (async (req, res) => {
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
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error during signup' });
    }
}));
// Login route
router.post('/login', (async (req, res) => {
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
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
}));
// Get user profile route (protected)
router.get('/me', auth_1.authenticateToken, (async (req, res) => {
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
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error getting user profile' });
    }
}));
// Google authentication route
router.post('/google', (async (req, res) => {
    try {
        const { token } = req.body;
        // Parse the JWT token using jwt-decode
        const payload = (0, jwt_decode_1.jwtDecode)(token);
        // Extract user info from the payload
        const { email, name, sub: googleId } = payload;
        console.log("Google auth attempt for:", email);
        // Check if user already exists
        let user = await UserDB.findByEmail(email);
        if (!user) {
            // Create new user if not exists
            console.log("Creating new user for Google auth:", email);
            // Generate a UUID for the new user
            const userId = (0, uuid_1.v4)();
            console.log("Generated UUID:", userId);
            // Generate a random password for the user
            const randomPassword = Math.random().toString(36).slice(-8);
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(randomPassword, salt);
            // Use direct SQL query with explicit parameters
            const insertQuery = `
        INSERT INTO users (id, name, email, password, google_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
            try {
                const client = await pool.connect();
                let insertResult;
                try {
                    await client.query('BEGIN');
                    const insertValues = [userId, name, email, hashedPassword, googleId];
                    console.log("Insert values:", JSON.stringify(insertValues));
                    insertResult = await client.query(insertQuery, insertValues);
                    if (insertResult.rows.length === 0) {
                        throw new Error("Failed to create user - no rows returned");
                    }
                    await client.query('COMMIT');
                    user = insertResult.rows[0];
                    console.log("New user created with ID:", user.id);
                }
                catch (innerError) {
                    await client.query('ROLLBACK');
                    console.error("Failed to insert user:", innerError);
                    throw innerError;
                }
                finally {
                    client.release();
                }
            }
            catch (dbError) {
                console.error("Database error during user creation:", dbError);
                return res.status(500).json({ message: 'Failed to create user account' });
            }
        }
        else {
            console.log("Existing user found for Google auth:", email);
        }
        // Generate JWT token for your app
        const appToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });
        res.json({
            message: 'Google authentication successful',
            token: appToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    }
    catch (error) {
        console.error('Google authentication error:', error);
        res.status(500).json({ message: 'Server error during Google authentication' });
    }
}));
exports.default = router;

import { Pool } from 'pg';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Log database connection information for debugging
console.log('Database connection info:');
console.log(`Host: ${process.env.POSTGRES_HOST || 'localhost'}`);
console.log(`Port: ${process.env.POSTGRES_PORT || '5432'}`); 
console.log(`Database: ${process.env.POSTGRES_DB || 'notion_clone'}`);
console.log(`User: ${process.env.POSTGRES_USER || 'postgres'}`);

// Create connection string
const connectionString = `postgres://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgres'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'notion_clone'}`;
console.log('Connecting with:', connectionString);

const pool = new Pool({ connectionString });

// Test database connection immediately
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Database connected successfully at:', res.rows[0].now);
    }
});

const createUsersTable = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `;

    try {
        await pool.query(createTableQuery);
        console.log('Users table created successfully');
    } catch (error) {
        console.error('Error creating users table', error);
        throw error;
    }
};

const initDb = async () => {
    await createUsersTable();
};

export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    created_at?: Date;
    updated_at?: Date;
}

export default {
    init: initDb,

    async findByEmail(email: string): Promise<User | null> {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0] || null;
    },

    async findById(id: number): Promise<User | null> {
        const query = 'SELECT * FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    },

    async create(userData: { name: string, email: string; password: string}): Promise<User> {

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

    async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return bcryptjs.compare(password, hashedPassword);
    }
};




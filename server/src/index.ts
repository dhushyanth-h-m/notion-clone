import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './models';
import authRoutes from './routes/auth';
import blockRoutes from './routes/blocks';
import workspaceRoutes from './routes/workspaces';
import pageRoutes from './routes/pages';

dotenv.config();

// Initialize Express app
const app = express();
app.use(cors({
  origin: '*', // Allow all origins during development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Initialize database
console.log('Attempting to initialize database...');
(async () => {
  try {
    await initDb();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }
})();

// Routes
app.use('/auth', authRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/pages', pageRoutes);

app.get('/', (req, res) => {
    res.send("Backend is running");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
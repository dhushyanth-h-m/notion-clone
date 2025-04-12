import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import User from './models/User';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize database
console.log('Attempting to initialize database...');
User.init()
  .then(() => {
    console.log('Database initialization successful');
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    // Don't exit the process in development to allow API testing
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

// Routes
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
    res.send("Backend is running");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
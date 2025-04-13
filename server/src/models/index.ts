import User from './UserModel';
import Page from './PageModel';
import Block from './BlockModel';
import sequelize from '../config/database';

// Initialize database
export const initDb = async () => {
  try {
    // Test connection
    await sequelize.authenticate();
    
    // Sync models with database (create tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export {
  User,
  Page,
  Block
}; 
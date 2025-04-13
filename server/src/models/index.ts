import User from './UserModel';
import Workspace from './WorkspaceModel';
import WorkspaceMember from './WorkspaceMemberModel';
import Block from './BlockModel';
import Property from './PropertyModel';
import Relation from './RelationModel';
import BlockHistory from './BlockHistoryModel';
import SearchIndex from './SearchIndexModel';
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
  Workspace,
  WorkspaceMember,
  Block,
  Property,
  Relation,
  BlockHistory,
  SearchIndex
}; 
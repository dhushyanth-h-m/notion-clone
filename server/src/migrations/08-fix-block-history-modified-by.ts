import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // This migration is now a no-op since we're using UUID for the user IDs from the start
    console.log('Migration 08 is now a no-op since we are using UUID consistently');
  },
  
  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Nothing to revert
  }
}; 
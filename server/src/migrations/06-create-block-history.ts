import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable('block_history', {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
      },
      block_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'blocks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: {
        type: DataTypes.JSONB,
        allowNull: false
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      modified_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      modified_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Create index for faster lookup
    await queryInterface.addIndex('block_history', ['block_id', 'version'], {
      name: 'idx_block_history'
    });
  },
  
  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeIndex('block_history', 'idx_block_history');
    await queryInterface.dropTable('block_history');
  }
}; 
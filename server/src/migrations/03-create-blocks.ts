import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable('blocks', {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: [['page', 'text', 'heading', 'database', 'table', 'todo']]
        }
      },
      content: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      parent_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'blocks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      workspace_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'workspaces',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      permissions: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: { public: false }
      }
    });

    // Create indexes
    await queryInterface.addIndex('blocks', ['parent_id'], {
      name: 'idx_blocks_parent'
    });
    
    await queryInterface.addIndex('blocks', ['workspace_id'], {
      name: 'idx_blocks_workspace'
    });
    
    await queryInterface.addIndex('blocks', ['type'], {
      name: 'idx_blocks_type'
    });
  },
  
  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeIndex('blocks', 'idx_blocks_parent');
    await queryInterface.removeIndex('blocks', 'idx_blocks_workspace');
    await queryInterface.removeIndex('blocks', 'idx_blocks_type');
    await queryInterface.dropTable('blocks');
  }
}; 
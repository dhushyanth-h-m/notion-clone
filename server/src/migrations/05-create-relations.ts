import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable('relations', {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
      },
      source_block: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'blocks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      target_block: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'blocks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      relation_type: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      properties: {
        type: DataTypes.JSONB,
        allowNull: true
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
      }
    });

    // Create indexes for faster lookup
    await queryInterface.addIndex('relations', ['source_block'], {
      name: 'idx_relations_source'
    });
    
    await queryInterface.addIndex('relations', ['target_block'], {
      name: 'idx_relations_target'
    });
  },
  
  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeIndex('relations', 'idx_relations_source');
    await queryInterface.removeIndex('relations', 'idx_relations_target');
    await queryInterface.dropTable('relations');
  }
}; 
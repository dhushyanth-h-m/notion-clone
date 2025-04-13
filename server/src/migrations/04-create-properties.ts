import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable('properties', {
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
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: [['text', 'number', 'select', 'multi_select', 'date', 'person', 'file', 'formula']]
        }
      },
      config: {
        type: DataTypes.JSONB,
        allowNull: false
      },
      value: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      position: {
        type: DataTypes.INTEGER,
        allowNull: false
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

    // Add unique constraint for block_id and name
    await queryInterface.addConstraint('properties', {
      fields: ['block_id', 'name'],
      type: 'unique',
      name: 'unique_block_property'
    });

    // Create index for faster lookup
    await queryInterface.addIndex('properties', ['block_id'], {
      name: 'idx_properties_block'
    });
  },
  
  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeConstraint('properties', 'unique_block_property');
    await queryInterface.removeIndex('properties', 'idx_properties_block');
    await queryInterface.dropTable('properties');
  }
}; 
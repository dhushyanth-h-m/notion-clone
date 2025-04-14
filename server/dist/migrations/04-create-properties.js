"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = {
    up: async (queryInterface) => {
        await queryInterface.createTable('properties', {
            id: {
                type: sequelize_1.DataTypes.UUID,
                primaryKey: true,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                allowNull: false
            },
            block_id: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'blocks',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            name: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            type: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false,
                validate: {
                    isIn: [['text', 'number', 'select', 'multi_select', 'date', 'person', 'file', 'formula']]
                }
            },
            config: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false
            },
            value: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true
            },
            position: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false
            },
            created_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize_1.DataTypes.NOW
            },
            updated_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize_1.DataTypes.NOW
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
    down: async (queryInterface) => {
        await queryInterface.removeConstraint('properties', 'unique_block_property');
        await queryInterface.removeIndex('properties', 'idx_properties_block');
        await queryInterface.dropTable('properties');
    }
};

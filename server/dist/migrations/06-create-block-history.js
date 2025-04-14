"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = {
    up: async (queryInterface) => {
        await queryInterface.createTable('block_history', {
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
            content: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false
            },
            version: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false
            },
            modified_by: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            modified_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize_1.DataTypes.NOW
            }
        });
        // Create index for faster lookup
        await queryInterface.addIndex('block_history', ['block_id', 'version'], {
            name: 'idx_block_history'
        });
    },
    down: async (queryInterface) => {
        await queryInterface.removeIndex('block_history', 'idx_block_history');
        await queryInterface.dropTable('block_history');
    }
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = {
    up: async (queryInterface) => {
        await queryInterface.createTable('blocks', {
            id: {
                type: sequelize_1.DataTypes.UUID,
                primaryKey: true,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                allowNull: false
            },
            type: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false,
                validate: {
                    isIn: [['page', 'text', 'heading', 'database', 'table', 'todo']]
                }
            },
            content: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false,
                defaultValue: {}
            },
            parent_id: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'blocks',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            workspace_id: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'workspaces',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            created_by: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
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
            },
            is_deleted: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            version: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            permissions: {
                type: sequelize_1.DataTypes.JSONB,
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
    down: async (queryInterface) => {
        await queryInterface.removeIndex('blocks', 'idx_blocks_parent');
        await queryInterface.removeIndex('blocks', 'idx_blocks_workspace');
        await queryInterface.removeIndex('blocks', 'idx_blocks_type');
        await queryInterface.dropTable('blocks');
    }
};

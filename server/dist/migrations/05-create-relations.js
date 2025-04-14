"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = {
    up: async (queryInterface) => {
        await queryInterface.createTable('relations', {
            id: {
                type: sequelize_1.DataTypes.UUID,
                primaryKey: true,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                allowNull: false
            },
            source_block: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'blocks',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            target_block: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'blocks',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            relation_type: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false
            },
            properties: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true
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
        // Create indexes for faster lookup
        await queryInterface.addIndex('relations', ['source_block'], {
            name: 'idx_relations_source'
        });
        await queryInterface.addIndex('relations', ['target_block'], {
            name: 'idx_relations_target'
        });
    },
    down: async (queryInterface) => {
        await queryInterface.removeIndex('relations', 'idx_relations_source');
        await queryInterface.removeIndex('relations', 'idx_relations_target');
        await queryInterface.dropTable('relations');
    }
};

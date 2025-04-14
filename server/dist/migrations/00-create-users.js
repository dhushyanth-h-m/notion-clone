"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = {
    up: async (queryInterface) => {
        await queryInterface.createTable('users', {
            id: {
                type: sequelize_1.DataTypes.UUID,
                primaryKey: true,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                allowNull: false
            },
            name: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false
            },
            email: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                unique: true
            },
            password: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false
            },
            google_id: {
                type: sequelize_1.DataTypes.STRING,
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
        // Add index on email for faster lookups
        await queryInterface.addIndex('users', ['email'], {
            name: 'idx_users_email',
            unique: true
        });
    },
    down: async (queryInterface) => {
        await queryInterface.removeIndex('users', 'idx_users_email');
        await queryInterface.dropTable('users');
    }
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const UserModel_1 = __importDefault(require("./UserModel"));
// Page model class
class Page extends sequelize_1.Model {
    // Optional getter for client-side compatibility
    get userId() {
        return this.user_id;
    }
    get createdAt() {
        return this.created_at;
    }
    get updatedAt() {
        return this.updated_at;
    }
}
// Initialize the model
Page.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Untitled'
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
}, {
    sequelize: database_1.default,
    tableName: 'pages',
    modelName: 'Page',
    timestamps: true,
    underscored: true
});
// Define associations
Page.belongsTo(UserModel_1.default, {
    foreignKey: 'user_id',
    as: 'user'
});
UserModel_1.default.hasMany(Page, {
    foreignKey: 'user_id',
    as: 'pages'
});
exports.default = Page;

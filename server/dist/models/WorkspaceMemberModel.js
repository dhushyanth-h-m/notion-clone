"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const WorkspaceModel_1 = __importDefault(require("./WorkspaceModel"));
const UserModel_1 = __importDefault(require("./UserModel"));
// WorkspaceMember model class
class WorkspaceMember extends sequelize_1.Model {
    // Optional getters for client-side compatibility
    get workspaceId() {
        return this.workspace_id;
    }
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
WorkspaceMember.init({
    workspace_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'workspaces',
            key: 'id'
        }
    },
    user_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('owner', 'admin', 'editor', 'viewer'),
        allowNull: false,
        defaultValue: 'viewer'
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
    tableName: 'workspace_members',
    modelName: 'WorkspaceMember',
    timestamps: true,
    underscored: true
});
// Set up associations
WorkspaceMember.belongsTo(WorkspaceModel_1.default, {
    foreignKey: 'workspace_id',
    as: 'workspace'
});
WorkspaceMember.belongsTo(UserModel_1.default, {
    foreignKey: 'user_id',
    as: 'user'
});
WorkspaceModel_1.default.hasMany(WorkspaceMember, {
    foreignKey: 'workspace_id',
    as: 'members'
});
UserModel_1.default.hasMany(WorkspaceMember, {
    foreignKey: 'user_id',
    as: 'workspaces'
});
exports.default = WorkspaceMember;

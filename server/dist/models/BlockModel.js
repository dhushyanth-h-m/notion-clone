"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const WorkspaceModel_1 = __importDefault(require("./WorkspaceModel"));
const UserModel_1 = __importDefault(require("./UserModel"));
// Block model class
class Block extends sequelize_1.Model {
    // Optional getters for client-side compatibility
    get parentId() {
        return this.parent_id;
    }
    get workspaceId() {
        return this.workspace_id;
    }
    get createdBy() {
        return this.created_by;
    }
    get createdAt() {
        return this.created_at;
    }
    get updatedAt() {
        return this.updated_at;
    }
    get isDeleted() {
        return this.is_deleted;
    }
}
// Initialize the model
Block.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true
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
        }
    },
    workspace_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'workspaces',
            key: 'id'
        }
    },
    created_by: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
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
}, {
    sequelize: database_1.default,
    tableName: 'blocks',
    modelName: 'Block',
    timestamps: true,
    underscored: true,
    // Exclude deleted blocks by default
    defaultScope: {
        where: {
            is_deleted: false
        }
    },
    // Include deleted blocks when needed
    scopes: {
        withDeleted: {}
    }
});
// Self-referencing association for parent-child relationship
Block.belongsTo(Block, {
    foreignKey: 'parent_id',
    as: 'parent'
});
Block.hasMany(Block, {
    foreignKey: 'parent_id',
    as: 'children'
});
// Associations with other models
Block.belongsTo(WorkspaceModel_1.default, {
    foreignKey: 'workspace_id',
    as: 'workspace'
});
Block.belongsTo(UserModel_1.default, {
    foreignKey: 'created_by',
    as: 'creator'
});
WorkspaceModel_1.default.hasMany(Block, {
    foreignKey: 'workspace_id',
    as: 'blocks'
});
UserModel_1.default.hasMany(Block, {
    foreignKey: 'created_by',
    as: 'created_blocks'
});
exports.default = Block;

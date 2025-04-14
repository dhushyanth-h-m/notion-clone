"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const BlockModel_1 = __importDefault(require("./BlockModel"));
const UserModel_1 = __importDefault(require("./UserModel"));
// BlockHistory model class
class BlockHistory extends sequelize_1.Model {
    // Optional getters for client-side compatibility
    get blockId() {
        return this.block_id;
    }
    get modifiedBy() {
        return this.modified_by;
    }
    get modifiedAt() {
        return this.modified_at;
    }
}
// Initialize the model
BlockHistory.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true
    },
    block_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'blocks',
            key: 'id'
        }
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
        }
    },
    modified_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    }
}, {
    sequelize: database_1.default,
    tableName: 'block_history',
    modelName: 'BlockHistory',
    timestamps: false,
    underscored: true,
    indexes: [
        {
            name: 'idx_block_history',
            fields: ['block_id', 'version']
        }
    ]
});
// Set up associations
BlockHistory.belongsTo(BlockModel_1.default, {
    foreignKey: 'block_id',
    as: 'block'
});
BlockHistory.belongsTo(UserModel_1.default, {
    foreignKey: 'modified_by',
    as: 'modifier'
});
BlockModel_1.default.hasMany(BlockHistory, {
    foreignKey: 'block_id',
    as: 'history'
});
exports.default = BlockHistory;

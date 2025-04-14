"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const BlockModel_1 = __importDefault(require("./BlockModel"));
// Relation model class
class Relation extends sequelize_1.Model {
    // Optional getters for client-side compatibility
    get sourceBlockId() {
        return this.source_block;
    }
    get targetBlockId() {
        return this.target_block;
    }
    get relationType() {
        return this.relation_type;
    }
    get createdAt() {
        return this.created_at;
    }
    get updatedAt() {
        return this.updated_at;
    }
}
// Initialize the model
Relation.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true
    },
    source_block: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'blocks',
            key: 'id'
        }
    },
    target_block: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'blocks',
            key: 'id'
        }
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
}, {
    sequelize: database_1.default,
    tableName: 'relations',
    modelName: 'Relation',
    timestamps: true,
    underscored: true
});
// Set up associations
Relation.belongsTo(BlockModel_1.default, {
    foreignKey: 'source_block',
    as: 'sourceBlock'
});
Relation.belongsTo(BlockModel_1.default, {
    foreignKey: 'target_block',
    as: 'targetBlock'
});
BlockModel_1.default.hasMany(Relation, {
    foreignKey: 'source_block',
    as: 'outgoingRelations'
});
BlockModel_1.default.hasMany(Relation, {
    foreignKey: 'target_block',
    as: 'incomingRelations'
});
exports.default = Relation;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const BlockModel_1 = __importDefault(require("./BlockModel"));
// Property model class
class Property extends sequelize_1.Model {
    // Optional getters for client-side compatibility
    get blockId() {
        return this.block_id;
    }
    get createdAt() {
        return this.created_at;
    }
    get updatedAt() {
        return this.updated_at;
    }
}
// Initialize the model
Property.init({
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
}, {
    sequelize: database_1.default,
    tableName: 'properties',
    modelName: 'Property',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['block_id', 'name']
        }
    ]
});
// Set up associations
Property.belongsTo(BlockModel_1.default, {
    foreignKey: 'block_id',
    as: 'block'
});
BlockModel_1.default.hasMany(Property, {
    foreignKey: 'block_id',
    as: 'properties'
});
exports.default = Property;

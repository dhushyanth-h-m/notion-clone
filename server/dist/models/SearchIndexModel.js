"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const BlockModel_1 = __importDefault(require("./BlockModel"));
// SearchIndex model class
class SearchIndex extends sequelize_1.Model {
    // Optional getters for client-side compatibility
    get blockId() {
        return this.block_id;
    }
}
// Initialize the model
SearchIndex.init({
    block_id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        references: {
            model: 'blocks',
            key: 'id'
        }
    },
    // We can't define TSVECTOR columns directly with Sequelize
    // These are defined in the migration with raw SQL
}, {
    sequelize: database_1.default,
    tableName: 'search_index',
    modelName: 'SearchIndex',
    timestamps: false,
    underscored: true
});
// Set up associations
SearchIndex.belongsTo(BlockModel_1.default, {
    foreignKey: 'block_id',
    as: 'block'
});
BlockModel_1.default.hasOne(SearchIndex, {
    foreignKey: 'block_id',
    as: 'searchIndex'
});
exports.default = SearchIndex;

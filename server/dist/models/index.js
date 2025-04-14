"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchIndex = exports.BlockHistory = exports.Relation = exports.Property = exports.Block = exports.WorkspaceMember = exports.Workspace = exports.User = exports.initDb = void 0;
const UserModel_1 = __importDefault(require("./UserModel"));
exports.User = UserModel_1.default;
const WorkspaceModel_1 = __importDefault(require("./WorkspaceModel"));
exports.Workspace = WorkspaceModel_1.default;
const WorkspaceMemberModel_1 = __importDefault(require("./WorkspaceMemberModel"));
exports.WorkspaceMember = WorkspaceMemberModel_1.default;
const BlockModel_1 = __importDefault(require("./BlockModel"));
exports.Block = BlockModel_1.default;
const PropertyModel_1 = __importDefault(require("./PropertyModel"));
exports.Property = PropertyModel_1.default;
const RelationModel_1 = __importDefault(require("./RelationModel"));
exports.Relation = RelationModel_1.default;
const BlockHistoryModel_1 = __importDefault(require("./BlockHistoryModel"));
exports.BlockHistory = BlockHistoryModel_1.default;
const SearchIndexModel_1 = __importDefault(require("./SearchIndexModel"));
exports.SearchIndex = SearchIndexModel_1.default;
const database_1 = __importDefault(require("../config/database"));
// Initialize database
const initDb = async () => {
    try {
        // Test connection
        await database_1.default.authenticate();
        // Sync models with database (create tables if they don't exist)
        await database_1.default.sync({ alter: true });
        console.log('Database synchronized successfully');
    }
    catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
};
exports.initDb = initDb;

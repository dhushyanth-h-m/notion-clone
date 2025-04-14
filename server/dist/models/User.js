"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const sequelize_1 = require("sequelize");
dotenv_1.default.config();
// Direct database connection for custom queries if needed
const connectionString = `postgres://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgres'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'notion_clone'}`;
const pool = new pg_1.Pool({ connectionString });
class User extends sequelize_1.Model {
    // Static method to initialize the model
    static initialize(sequelize) {
        User.init({
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
            },
            email: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                unique: true,
            },
            password: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
            },
            google_id: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            created_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize_1.DataTypes.NOW,
            },
            updated_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize_1.DataTypes.NOW,
            },
        }, {
            sequelize,
            tableName: 'users',
            timestamps: true,
            underscored: true, // Use snake_case for column names
        });
        // Hash password before saving
        User.beforeCreate(async (user) => {
            const salt = await bcryptjs_1.default.genSalt(10);
            user.password = await bcryptjs_1.default.hash(user.password, salt);
        });
        return User;
    }
    // Find a user by email
    static async findByEmail(email) {
        return await User.findOne({ where: { email } });
    }
    // Find a user by ID
    static async findById(id) {
        return await User.findByPk(id);
    }
    // Create a user (renamed to createUser to avoid conflicts with Sequelize's create method)
    static async createUser(userData) {
        return await User.create(userData);
    }
    // Compare password
    static async comparePassword(password, hashedPassword) {
        return await bcryptjs_1.default.compare(password, hashedPassword);
    }
    // Compare a password with this user's password
    async comparePassword(password) {
        return await bcryptjs_1.default.compare(password, this.password);
    }
    // Create a user with Google
    static async createWithGoogle(userData) {
        // Generate a random password for Google users
        const randomPassword = Math.random().toString(36).slice(-8);
        return await User.create({
            name: userData.name,
            email: userData.email,
            password: randomPassword,
            google_id: userData.googleId
        });
    }
}
exports.default = User;

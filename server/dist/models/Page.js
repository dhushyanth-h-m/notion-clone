"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const sequelize_1 = require("sequelize");
dotenv_1.default.config();
// Direct database connection for custom queries if needed
const connectionString = `postgres://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgres'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'notion_clone'}`;
const pool = new pg_1.Pool({ connectionString });
class Page extends sequelize_1.Model {
    // Static method to initialize the model
    static initialize(sequelize) {
        Page.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            title: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
            },
            content: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            user_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
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
            tableName: 'pages',
            timestamps: true,
            underscored: true, // Use snake_case for column names
        });
        return Page;
    }
    // Helper method to find pages by user ID
    static async findByUserId(userId) {
        const query = 'SELECT * FROM pages WHERE user_id = $1 ORDER BY updated_at DESC';
        const result = await pool.query(query, [userId]);
        return result.rows;
    }
    // Helper method to find a page by ID and user ID (for authorization)
    static async findByIdAndUserId(pageId, userId) {
        const query = 'SELECT * FROM pages WHERE id = $1 AND user_id = $2';
        const result = await pool.query(query, [pageId, userId]);
        return result.rows[0] || null;
    }
    // Helper method to create a new page
    static async createPage(pageData) {
        const query = `
      INSERT INTO pages (title, content, user_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
        const values = [pageData.title, pageData.content, pageData.user_id];
        const result = await pool.query(query, values);
        return result.rows[0];
    }
    // Helper method to update a page
    static async updatePage(pageId, userId, pageData) {
        // First check if page exists and belongs to user
        const page = await this.findByIdAndUserId(pageId, userId);
        if (!page) {
            return null;
        }
        const query = `
      UPDATE pages
      SET title = $1, content = $2, updated_at = NOW()
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `;
        const values = [
            pageData.title || page.title,
            pageData.content || page.content,
            pageId,
            userId
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    }
    // Helper method to delete a page
    static async deletePage(pageId, userId) {
        // First check if page exists and belongs to user
        const page = await this.findByIdAndUserId(pageId, userId);
        if (!page) {
            return false;
        }
        const query = 'DELETE FROM pages WHERE id = $1 AND user_id = $2';
        await pool.query(query, [pageId, userId]);
        return true;
    }
}
exports.default = Page;

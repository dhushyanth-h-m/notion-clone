import { Pool } from 'pg';
import dotenv from 'dotenv';
import { DataTypes, Model, Sequelize } from 'sequelize';

dotenv.config();

// Direct database connection for custom queries if needed
const connectionString = `postgres://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgres'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'notion_clone'}`;
const pool = new Pool({ connectionString });

export interface PageAttributes {
  id: number;
  title: string;
  content: string;
  user_id: number;
  created_at?: Date;
  updated_at?: Date;
}

class Page extends Model<PageAttributes> {
  public id!: number;
  public title!: string;
  public content!: string;
  public user_id!: number;
  public created_at!: Date;
  public updated_at!: Date;

  // Static method to initialize the model
  static initialize(sequelize: Sequelize) {
    Page.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        title: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'pages',
        timestamps: true,
        underscored: true, // Use snake_case for column names
      }
    );

    return Page;
  }

  // Helper method to find pages by user ID
  static async findByUserId(userId: number) {
    const query = 'SELECT * FROM pages WHERE user_id = $1 ORDER BY updated_at DESC';
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Helper method to find a page by ID and user ID (for authorization)
  static async findByIdAndUserId(pageId: number, userId: number) {
    const query = 'SELECT * FROM pages WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [pageId, userId]);
    return result.rows[0] || null;
  }

  // Helper method to create a new page
  static async createPage(pageData: { title: string, content: string, user_id: number }) {
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
  static async updatePage(pageId: number, userId: number, pageData: { title?: string, content?: string }) {
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
  static async deletePage(pageId: number, userId: number) {
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

export default Page; 
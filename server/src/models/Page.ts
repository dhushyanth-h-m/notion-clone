import { Pool } from 'pg';
import dotenv from 'dotenv';
import { DataTypes, Model, Sequelize } from 'sequelize';

dotenv.config();

// Force Docker mode when running in container
process.env.RUNNING_IN_DOCKER = 'true';
const isRunningInDocker = true;
// Use postgres container name in Docker
const dbHost = 'postgres';

// Direct database connection for custom queries if needed
const connectionString = `postgres://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgres'}@${dbHost}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'notion_clone'}`;
console.log(`Page model connecting to PostgreSQL at ${connectionString}`);
const pool = new Pool({ connectionString });

export interface PageAttributes {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at?: Date;
  updated_at?: Date;
}

class Page extends Model<PageAttributes> {
  public id!: string;
  public title!: string;
  public content!: string;
  public user_id!: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Static method to initialize the model
  static initialize(sequelize: Sequelize) {
    Page.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
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
          type: DataTypes.UUID,
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
  static async findByUserId(userId: string) {
    const query = 'SELECT * FROM pages WHERE user_id = $1 ORDER BY updated_at DESC';
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Helper method to find a page by ID and user ID (for authorization)
  static async findByIdAndUserId(pageId: string, userId: string) {
    const query = 'SELECT * FROM pages WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [pageId, userId]);
    return result.rows[0] || null;
  }

  // Helper method to create a new page
  static async createPage(pageData: { title: string, content: string, user_id: string }) {
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
  static async updatePage(pageId: string, userId: string, pageData: { title?: string, content?: string }) {
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
  static async deletePage(pageId: string, userId: string) {
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
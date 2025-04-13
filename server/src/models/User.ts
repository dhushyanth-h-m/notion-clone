import { Pool } from 'pg';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import { DataTypes, Model, Sequelize, CreateOptions } from 'sequelize';

dotenv.config();

// Direct database connection for custom queries if needed
const connectionString = `postgres://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgres'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'notion_clone'}`;
const pool = new Pool({ connectionString });

export interface UserAttributes {
  id: string;
  name: string;
  email: string;
  password: string;
  google_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserCreationAttributes {
  name: string;
  email: string;
  password: string;
  google_id?: string;
}

class User extends Model<UserAttributes, UserCreationAttributes> {
  public id!: string;
  public name!: string;
  public email!: string;
  public password!: string;
  public google_id?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Static method to initialize the model
  static initialize(sequelize: Sequelize) {
    User.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        google_id: {
          type: DataTypes.STRING,
          allowNull: true,
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
        tableName: 'users',
        timestamps: true,
        underscored: true, // Use snake_case for column names
      }
    );

    // Hash password before saving
    User.beforeCreate(async (user: User) => {
      const salt = await bcryptjs.genSalt(10);
      user.password = await bcryptjs.hash(user.password, salt);
    });

    return User;
  }

  // Find a user by email
  static async findByEmail(email: string): Promise<User | null> {
    return await User.findOne({ where: { email } });
  }

  // Find a user by ID
  static async findById(id: string): Promise<User | null> {
    return await User.findByPk(id);
  }

  // Create a user (renamed to createUser to avoid conflicts with Sequelize's create method)
  static async createUser(userData: { name: string, email: string, password: string }): Promise<User> {
    return await User.create(userData);
  }

  // Compare password
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcryptjs.compare(password, hashedPassword);
  }

  // Compare a password with this user's password
  async comparePassword(password: string): Promise<boolean> {
    return await bcryptjs.compare(password, this.password);
  }

  // Create a user with Google
  static async createWithGoogle(userData: { name: string, email: string, googleId: string }): Promise<User> {
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

export default User;




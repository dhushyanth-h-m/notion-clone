import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './UserModel';

// Interface for Page attributes
interface PageAttributes {
  id: string;
  user_id: number;
  title: string;
  created_at: Date;
  updated_at: Date;
}

// Interface for creating a new Page
interface PageCreationAttributes extends Optional<PageAttributes, 'created_at' | 'updated_at'> {}

// Page model class
class Page extends Model<PageAttributes, PageCreationAttributes> implements PageAttributes {
  public id!: string;
  public user_id!: number;
  public title!: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Optional getter for client-side compatibility
  public get userId(): number {
    return this.user_id;
  }
  
  public get createdAt(): Date {
    return this.created_at;
  }
  
  public get updatedAt(): Date {
    return this.updated_at;
  }
}

// Initialize the model
Page.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Untitled'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'pages',
    modelName: 'Page',
    timestamps: true,
    underscored: true
  }
);

// Define associations
Page.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

User.hasMany(Page, {
  foreignKey: 'user_id',
  as: 'pages'
});

export default Page; 
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Page from './PageModel';

// Interface for Block attributes
interface BlockAttributes {
  id: string;
  page_id: string;
  parent_id: string | null;
  type: 'text' | 'heading' | 'list';
  content: string;
  position: number;
  created_at: Date;
  updated_at: Date;
}

// Interface for creating a new Block
interface BlockCreationAttributes extends Optional<BlockAttributes, 'parent_id' | 'position' | 'created_at' | 'updated_at'> {}

// Block model class
class Block extends Model<BlockAttributes, BlockCreationAttributes> implements BlockAttributes {
  public id!: string;
  public page_id!: string;
  public parent_id!: string | null;
  public type!: 'text' | 'heading' | 'list';
  public content!: string;
  public position!: number;
  public created_at!: Date;
  public updated_at!: Date;
  
  // Optional getter for client-side compatibility
  public get pageId(): string {
    return this.page_id;
  }
  
  public get parentId(): string | null {
    return this.parent_id;
  }
  
  public get createdAt(): Date {
    return this.created_at;
  }
  
  public get updatedAt(): Date {
    return this.updated_at;
  }
  
  // Virtual field for children blocks (populated through association)
  public children?: Block[];
}

// Initialize the model
Block.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    page_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'pages',
        key: 'id'
      }
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'blocks',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('text', 'heading', 'list'),
      allowNull: false,
      defaultValue: 'text'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
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
    tableName: 'blocks',
    modelName: 'Block',
    timestamps: true,
    underscored: true
  }
);

// Define associations
Block.belongsTo(Page, {
  foreignKey: 'page_id',
  as: 'page'
});

Page.hasMany(Block, {
  foreignKey: 'page_id',
  as: 'blocks'
});

// Self-referencing association for parent-child relationship
Block.belongsTo(Block, {
  foreignKey: 'parent_id',
  as: 'parent'
});

Block.hasMany(Block, {
  foreignKey: 'parent_id',
  as: 'children'
});

export default Block; 
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Workspace from './WorkspaceModel';
import User from './UserModel';

// Valid block types
export type BlockType = 'page' | 'text' | 'heading' | 'database' | 'table' | 'todo';

// Block attributes interface
interface BlockAttributes {
  id: string;
  type: BlockType;
  content: Record<string, any>;
  parent_id: string | null;
  workspace_id: string;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
  version: number;
  permissions: Record<string, any>;
}

// Block creation attributes interface (optional fields for creation)
interface BlockCreationAttributes extends Optional<BlockAttributes, 
  'id' | 'parent_id' | 'created_by' | 'created_at' | 'updated_at' | 'is_deleted' | 'version' | 'permissions'
> {}

// Block model class
class Block extends Model<BlockAttributes, BlockCreationAttributes> implements BlockAttributes {
  public id!: string;
  public type!: BlockType;
  public content!: Record<string, any>;
  public parent_id!: string | null;
  public workspace_id!: string;
  public created_by!: string | null;
  public created_at!: Date;
  public updated_at!: Date;
  public is_deleted!: boolean;
  public version!: number;
  public permissions!: Record<string, any>;
  
  // Virtual fields for related data
  public children?: Block[];
  public properties?: any[];
  public parent?: Block;
  public creator?: User;
  public workspace?: Workspace;
  
  // Optional getters for client-side compatibility
  public get parentId(): string | null {
    return this.parent_id;
  }
  
  public get workspaceId(): string {
    return this.workspace_id;
  }
  
  public get createdBy(): string | null {
    return this.created_by;
  }
  
  public get createdAt(): Date {
    return this.created_at;
  }
  
  public get updatedAt(): Date {
    return this.updated_at;
  }
  
  public get isDeleted(): boolean {
    return this.is_deleted;
  }
}

// Initialize the model
Block.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['page', 'text', 'heading', 'database', 'table', 'todo']]
      }
    },
    content: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'blocks',
        key: 'id'
      }
    },
    workspace_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'workspaces',
        key: 'id'
      }
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
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
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: { public: false }
    }
  },
  {
    sequelize,
    tableName: 'blocks',
    modelName: 'Block',
    timestamps: true,
    underscored: true,
    // Exclude deleted blocks by default
    defaultScope: {
      where: {
        is_deleted: false
      }
    },
    // Include deleted blocks when needed
    scopes: {
      withDeleted: {}
    }
  }
);

// Self-referencing association for parent-child relationship
Block.belongsTo(Block, {
  foreignKey: 'parent_id',
  as: 'parent'
});

Block.hasMany(Block, {
  foreignKey: 'parent_id',
  as: 'children'
});

// Associations with other models
Block.belongsTo(Workspace, {
  foreignKey: 'workspace_id',
  as: 'workspace'
});

Block.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

Workspace.hasMany(Block, {
  foreignKey: 'workspace_id',
  as: 'blocks'
});

User.hasMany(Block, {
  foreignKey: 'created_by',
  as: 'created_blocks'
});

export default Block; 
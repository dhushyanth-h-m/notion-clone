import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Block from './BlockModel';
import User from './UserModel';

// BlockHistory attributes interface
interface BlockHistoryAttributes {
  id: string;
  block_id: string;
  content: Record<string, any>;
  version: number;
  modified_by: string | null;
  modified_at: Date;
}

// BlockHistory creation attributes interface (optional fields for creation)
interface BlockHistoryCreationAttributes extends Optional<BlockHistoryAttributes, 'id' | 'modified_at'> {}

// BlockHistory model class
class BlockHistory extends Model<BlockHistoryAttributes, BlockHistoryCreationAttributes> implements BlockHistoryAttributes {
  public id!: string;
  public block_id!: string;
  public content!: Record<string, any>;
  public version!: number;
  public modified_by!: string | null;
  public modified_at!: Date;
  
  // Virtual fields for related data
  public block?: Block;
  public modifier?: User;
  
  // Optional getters for client-side compatibility
  public get blockId(): string {
    return this.block_id;
  }
  
  public get modifiedBy(): string | null {
    return this.modified_by;
  }
  
  public get modifiedAt(): Date {
    return this.modified_at;
  }
}

// Initialize the model
BlockHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    block_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'blocks',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    modified_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    modified_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'block_history',
    modelName: 'BlockHistory',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'idx_block_history',
        fields: ['block_id', 'version']
      }
    ]
  }
);

// Set up associations
BlockHistory.belongsTo(Block, {
  foreignKey: 'block_id',
  as: 'block'
});

BlockHistory.belongsTo(User, {
  foreignKey: 'modified_by',
  as: 'modifier'
});

Block.hasMany(BlockHistory, {
  foreignKey: 'block_id',
  as: 'history'
});

export default BlockHistory; 
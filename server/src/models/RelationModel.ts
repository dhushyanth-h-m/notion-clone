import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Block from './BlockModel';

// Relation attributes interface
interface RelationAttributes {
  id: string;
  source_block: string;
  target_block: string;
  relation_type: string;
  properties: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

// Relation creation attributes interface (optional fields for creation)
interface RelationCreationAttributes extends Optional<RelationAttributes, 'id' | 'properties' | 'created_at' | 'updated_at'> {}

// Relation model class
class Relation extends Model<RelationAttributes, RelationCreationAttributes> implements RelationAttributes {
  public id!: string;
  public source_block!: string;
  public target_block!: string;
  public relation_type!: string;
  public properties!: Record<string, any> | null;
  public created_at!: Date;
  public updated_at!: Date;
  
  // Virtual fields for related data
  public sourceBlock?: Block;
  public targetBlock?: Block;
  
  // Optional getters for client-side compatibility
  public get sourceBlockId(): string {
    return this.source_block;
  }
  
  public get targetBlockId(): string {
    return this.target_block;
  }
  
  public get relationType(): string {
    return this.relation_type;
  }
  
  public get createdAt(): Date {
    return this.created_at;
  }
  
  public get updatedAt(): Date {
    return this.updated_at;
  }
}

// Initialize the model
Relation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    source_block: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'blocks',
        key: 'id'
      }
    },
    target_block: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'blocks',
        key: 'id'
      }
    },
    relation_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    properties: {
      type: DataTypes.JSONB,
      allowNull: true
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
    tableName: 'relations',
    modelName: 'Relation',
    timestamps: true,
    underscored: true
  }
);

// Set up associations
Relation.belongsTo(Block, {
  foreignKey: 'source_block',
  as: 'sourceBlock'
});

Relation.belongsTo(Block, {
  foreignKey: 'target_block',
  as: 'targetBlock'
});

Block.hasMany(Relation, {
  foreignKey: 'source_block',
  as: 'outgoingRelations'
});

Block.hasMany(Relation, {
  foreignKey: 'target_block',
  as: 'incomingRelations'
});

export default Relation; 
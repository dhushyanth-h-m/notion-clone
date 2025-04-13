import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Block from './BlockModel';

// Valid property types
export type PropertyType = 'text' | 'number' | 'select' | 'multi_select' | 'date' | 'person' | 'file' | 'formula';

// Property attributes interface
interface PropertyAttributes {
  id: string;
  block_id: string;
  name: string;
  type: PropertyType;
  config: Record<string, any>;
  value: Record<string, any> | null;
  position: number;
  created_at: Date;
  updated_at: Date;
}

// Property creation attributes interface (optional fields for creation)
interface PropertyCreationAttributes extends Optional<PropertyAttributes, 'id' | 'value' | 'created_at' | 'updated_at'> {}

// Property model class
class Property extends Model<PropertyAttributes, PropertyCreationAttributes> implements PropertyAttributes {
  public id!: string;
  public block_id!: string;
  public name!: string;
  public type!: PropertyType;
  public config!: Record<string, any>;
  public value!: Record<string, any> | null;
  public position!: number;
  public created_at!: Date;
  public updated_at!: Date;
  
  // Virtual fields for related data
  public block?: Block;
  
  // Optional getters for client-side compatibility
  public get blockId(): string {
    return this.block_id;
  }
  
  public get createdAt(): Date {
    return this.created_at;
  }
  
  public get updatedAt(): Date {
    return this.updated_at;
  }
}

// Initialize the model
Property.init(
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['text', 'number', 'select', 'multi_select', 'date', 'person', 'file', 'formula']]
      }
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false
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
    tableName: 'properties',
    modelName: 'Property',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['block_id', 'name']
      }
    ]
  }
);

// Set up associations
Property.belongsTo(Block, {
  foreignKey: 'block_id',
  as: 'block'
});

Block.hasMany(Property, {
  foreignKey: 'block_id',
  as: 'properties'
});

export default Property; 
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Workspace attributes interface
interface WorkspaceAttributes {
  id: string;
  name: string;
  icon: string | null;
  owner_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// Workspace creation attributes interface (optional fields for creation)
interface WorkspaceCreationAttributes extends Optional<WorkspaceAttributes, 'id' | 'icon' | 'created_at' | 'updated_at'> {}

// Workspace model class
class Workspace extends Model<WorkspaceAttributes, WorkspaceCreationAttributes> implements WorkspaceAttributes {
  public id!: string;
  public name!: string;
  public icon!: string | null;
  public owner_id!: string | null;
  public created_at!: Date;
  public updated_at!: Date;

  // Optional getters for client-side compatibility
  public get ownerId(): string | null {
    return this.owner_id;
  }

  public get createdAt(): Date {
    return this.created_at;
  }

  public get updatedAt(): Date {
    return this.updated_at;
  }
}

// Initialize the model
Workspace.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    owner_id: {
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
    }
  },
  {
    sequelize,
    tableName: 'workspaces',
    modelName: 'Workspace',
    timestamps: true,
    underscored: true
  }
);

export default Workspace; 
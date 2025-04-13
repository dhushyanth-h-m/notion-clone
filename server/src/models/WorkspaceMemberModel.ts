import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import Workspace from './WorkspaceModel';
import User from './UserModel';

// Valid roles for workspace members
export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';

// WorkspaceMember attributes interface
interface WorkspaceMemberAttributes {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: Date;
  updated_at: Date;
}

// WorkspaceMember creation attributes interface (optional fields for creation)
interface WorkspaceMemberCreationAttributes extends Optional<WorkspaceMemberAttributes, 'created_at' | 'updated_at'> {}

// WorkspaceMember model class
class WorkspaceMember extends Model<WorkspaceMemberAttributes, WorkspaceMemberCreationAttributes> implements WorkspaceMemberAttributes {
  public workspace_id!: string;
  public user_id!: string;
  public role!: WorkspaceRole;
  public created_at!: Date;
  public updated_at!: Date;

  // Optional getters for client-side compatibility
  public get workspaceId(): string {
    return this.workspace_id;
  }

  public get userId(): string {
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
WorkspaceMember.init(
  {
    workspace_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'workspaces',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.ENUM('owner', 'admin', 'editor', 'viewer'),
      allowNull: false,
      defaultValue: 'viewer'
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
    tableName: 'workspace_members',
    modelName: 'WorkspaceMember',
    timestamps: true,
    underscored: true
  }
);

// Set up associations
WorkspaceMember.belongsTo(Workspace, {
  foreignKey: 'workspace_id',
  as: 'workspace'
});

WorkspaceMember.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Workspace.hasMany(WorkspaceMember, {
  foreignKey: 'workspace_id',
  as: 'members'
});

User.hasMany(WorkspaceMember, {
  foreignKey: 'user_id',
  as: 'workspaces'
});

export default WorkspaceMember; 
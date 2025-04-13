import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcryptjs from 'bcryptjs';

// Interface for User attributes
interface UserAttributes {
  id: string;
  name: string;
  email: string;
  password: string;
  google_id?: string;
  created_at: Date;
  updated_at: Date;
}

// Interface for creating a new User (id is optional as it's auto-generated)
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at' | 'google_id'> {}

// User model class
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public name!: string;
  public email!: string;
  public password!: string;
  public google_id?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Helper methods
  public async comparePassword(password: string): Promise<boolean> {
    return bcryptjs.compare(password, this.password);
  }
}

// Initialize the model
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
    modelName: 'User',
    timestamps: true,
    underscored: true, // Use snake_case for column names
  }
);

// Hooks
User.beforeCreate(async (user) => {
  const salt = await bcryptjs.genSalt(10);
  user.password = await bcryptjs.hash(user.password, salt);
});

export default User; 
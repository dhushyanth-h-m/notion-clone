import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Block from './BlockModel';

// SearchIndex attributes interface
interface SearchIndexAttributes {
  block_id: string;
  content_vector?: any; // TSVECTOR type isn't directly supported in TypeScript
  properties_vector?: any;
  relations_vector?: any;
}

// SearchIndex creation attributes interface (optional fields for creation)
interface SearchIndexCreationAttributes extends Optional<SearchIndexAttributes, 'content_vector' | 'properties_vector' | 'relations_vector'> {}

// SearchIndex model class
class SearchIndex extends Model<SearchIndexAttributes, SearchIndexCreationAttributes> implements SearchIndexAttributes {
  public block_id!: string;
  public content_vector?: any;
  public properties_vector?: any;
  public relations_vector?: any;
  
  // Virtual fields for related data
  public block?: Block;
  
  // Optional getters for client-side compatibility
  public get blockId(): string {
    return this.block_id;
  }
}

// Initialize the model
SearchIndex.init(
  {
    block_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'blocks',
        key: 'id'
      }
    },
    // We can't define TSVECTOR columns directly with Sequelize
    // These are defined in the migration with raw SQL
  },
  {
    sequelize,
    tableName: 'search_index',
    modelName: 'SearchIndex',
    timestamps: false,
    underscored: true
  }
);

// Set up associations
SearchIndex.belongsTo(Block, {
  foreignKey: 'block_id',
  as: 'block'
});

Block.hasOne(SearchIndex, {
  foreignKey: 'block_id',
  as: 'searchIndex'
});

export default SearchIndex; 
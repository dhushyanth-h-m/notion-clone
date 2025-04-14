"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = {
    up: async (queryInterface) => {
        // Check if PostgreSQL version supports TSVECTOR (it should be 9.6+)
        await queryInterface.sequelize.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
    `);
        await queryInterface.createTable('search_index', {
            block_id: {
                type: sequelize_1.DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: 'blocks',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            }
        });
        // Add TSVECTOR columns with raw SQL since Sequelize doesn't directly support it
        await queryInterface.sequelize.query(`
      ALTER TABLE search_index ADD COLUMN content_vector TSVECTOR;
      ALTER TABLE search_index ADD COLUMN properties_vector TSVECTOR;
      ALTER TABLE search_index ADD COLUMN relations_vector TSVECTOR;
    `);
        // Create GIN indexes for TSVECTOR columns
        await queryInterface.sequelize.query(`
      CREATE INDEX idx_search_content ON search_index USING GIN(content_vector);
      CREATE INDEX idx_search_properties ON search_index USING GIN(properties_vector);
    `);
    },
    down: async (queryInterface) => {
        await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_search_content;
      DROP INDEX IF EXISTS idx_search_properties;
    `);
        await queryInterface.dropTable('search_index');
    }
};

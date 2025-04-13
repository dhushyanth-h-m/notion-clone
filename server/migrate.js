// This script allows running TypeScript migrations
require('ts-node/register');
const path = require('path');
const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');

const config = require('./src/config/config.json').development;

async function runMigrations() {
  const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    logging: console.log,
  });

  try {
    await sequelize.authenticate();
    console.log('Connection to database established successfully.');

    const umzug = new Umzug({
      migrations: {
        glob: 'src/migrations/*.ts',
        resolve: ({ name, path, context }) => {
          // Adjust the import to work with ES modules
          const migration = require(path);
          return {
            name,
            up: async () => migration.default.up(context, Sequelize),
            down: async () => migration.default.down(context, Sequelize),
          };
        },
      },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize }),
      logger: console,
    });

    await umzug.up();
    console.log('All migrations executed successfully!');
  } catch (error) {
    console.error('Error executing migrations:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigrations(); 
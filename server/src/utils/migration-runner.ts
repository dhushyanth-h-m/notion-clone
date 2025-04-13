import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import config from '../config/config.json';

// Read the environment from NODE_ENV or default to development
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env as keyof typeof config];

async function runMigrations() {
  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      dialect: dbConfig.dialect as any,
      logging: console.log,
    }
  );

  try {
    await sequelize.authenticate();
    console.log('Connection to database established successfully.');

    // Get the migrations directory
    const migrationsDir = path.join(__dirname, '../migrations');
    
    // Read all migration files and sort them
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(file => file.endsWith('.ts'))
      .sort();

    console.log('Migration files found:', migrationFiles);

    // Create migrations table if it doesn't exist
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        name VARCHAR(255) NOT NULL PRIMARY KEY
      )`
    );

    // Get already executed migrations
    let executedNames: string[] = [];
    try {
      const [executedMigrations] = await sequelize.query(
        'SELECT name FROM "SequelizeMeta"'
      );
      executedNames = executedMigrations.map((m: any) => m.name);
    } catch (error) {
      console.log('No previously executed migrations found or SequelizeMeta table is empty.');
    }

    console.log('Already executed migrations:', executedNames);

    // Run migrations in sequence
    for (const file of migrationFiles) {
      if (executedNames.includes(file)) {
        console.log(`Migration ${file} already executed, skipping...`);
        continue;
      }

      console.log(`Running migration: ${file}`);
      const migration = require(path.join(migrationsDir, file)).default;

      // Execute the migration
      await migration.up(sequelize.getQueryInterface(), Sequelize);
      
      // Record the migration
      await sequelize.query(
        'INSERT INTO "SequelizeMeta" (name) VALUES (?)',
        {
          replacements: [file],
          type: 'INSERT'
        }
      );

      console.log(`Migration ${file} executed successfully.`);
    }

    console.log('All migrations executed successfully!');
  } catch (error) {
    console.error('Error executing migrations:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigrations(); 
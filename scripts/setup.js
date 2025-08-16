#!/usr/bin/env node

const dotenv = require('dotenv');
const MigrationUtils = require('../utils/migrationUtils');
const SeedUtils = require('../utils/seedUtils');
const { MESSAGES } = require('../utils/constants');

dotenv.config();

/**
 * Setup database schema and structure
 */
async function setupDatabase() {
  console.log(MESSAGES.SETUP.START);

  try {
    // Create connection without database
    const connection = await MigrationUtils.createConnection(false);
    console.log(MESSAGES.SETUP.DB_CONNECTED);

    // Create database
    const dbName = process.env.DB_NAME || 'framtt_demo';
    await MigrationUtils.createDatabase(connection, dbName);
    
    // Switch to database
    await connection.execute(`USE ${dbName}`);

    // Run migrations
    await MigrationUtils.runMigrations(connection);

    // Validate setup
    await MigrationUtils.validateSetup(connection);

    // Close connection
    await connection.end();

    console.log(MESSAGES.SETUP.SETUP_COMPLETE);
    console.log('');
    console.log('Next steps:');
    MESSAGES.NEXT_STEPS.forEach(step => console.log(step));
    
    return true;
  } catch (error) {
    console.error(MESSAGES.SETUP.SETUP_FAILED, error.message);
    process.exit(1);
  }
}

/**
 * Seed database with sample data
 */
async function seedDatabase(force = false) {
  console.log(MESSAGES.SEED.START);

  try {
    const connection = await SeedUtils.createConnection();
    console.log(MESSAGES.SEED.CONNECTED);

    const success = await SeedUtils.runSeeds(connection, force);
    
    if (success) {
      // Show statistics
      const stats = await SeedUtils.getSeedingStats(connection);
      console.log('\n📊 Seeding Statistics:');
      Object.entries(stats).forEach(([table, count]) => {
        console.log(`  ${table}: ${count} records`);
      });
    }

    await connection.end();
    return success;
  } catch (error) {
    console.error(MESSAGES.SEED.SEED_FAILED, error.message);
    process.exit(1);
  }
}

// CLI handling
const command = process.argv[2];
const force = process.argv.includes('--force');

async function main() {
  switch (command) {
    case 'seed':
      await seedDatabase(force);
      break;
    case 'setup':
    default:
      await setupDatabase();
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { setupDatabase, seedDatabase };
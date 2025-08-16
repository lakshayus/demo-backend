#!/usr/bin/env node

const dotenv = require('dotenv');
const MigrationUtils = require('../utils/migrationUtils');
const { MESSAGES } = require('../utils/constants');

dotenv.config();

/**
 * Run database migrations
 */
async function runMigrations() {
  console.log('🔄 Running database migrations...');

  try {
    const connection = await MigrationUtils.createConnection(true);
    console.log('✅ Connected to database');

    await MigrationUtils.runMigrations(connection);
    await MigrationUtils.validateSetup(connection);

    await connection.end();
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
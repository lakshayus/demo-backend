#!/usr/bin/env node

const dotenv = require('dotenv');
const SeedUtils = require('../utils/seedUtils');
const { MESSAGES } = require('../utils/constants');

dotenv.config();

/**
 * Seed database with sample data
 */
async function runSeeds() {
  const force = process.argv.includes('--force');
  
  console.log(MESSAGES.SEED.START);
  if (force) {
    console.log('⚠️  Force mode enabled - will override existing data');
  }

  try {
    const connection = await SeedUtils.createConnection();
    console.log(MESSAGES.SEED.CONNECTED);

    const success = await SeedUtils.runSeeds(connection, force);
    
    if (success) {
      const stats = await SeedUtils.getSeedingStats(connection);
      
      console.log('\n📊 Database Statistics:');
      Object.entries(stats).forEach(([table, count]) => {
        console.log(`  📋 ${table}: ${count} records`);
      });
      
      console.log('\n🎉 Database seeded successfully!');
      console.log('\nYou can now:');
      console.log('• Start the server: npm start');
      console.log('• View sample data in your database');
      console.log('• Test API endpoints');
    }

    await connection.end();
  } catch (error) {
    console.error(MESSAGES.SEED.SEED_FAILED, error.message);
    process.exit(1);
  }
}

// Run if called directly  
if (require.main === module) {
  runSeeds();
}

module.exports = { runSeeds };
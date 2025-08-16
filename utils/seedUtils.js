const mysql = require('mysql2/promise');
const path = require('path');
const DatabaseUtils = require('./dbUtils');
const { DB_CONFIG, PATHS, MESSAGES, TABLES } = require('./constants');

class SeedUtils {
  /**
   * Create database connection with database selected
   * @returns {mysql.Connection} Database connection
   */
  static async createConnection() {
    return await mysql.createConnection({
      host: process.env.DB_HOST || DB_CONFIG.DEFAULT_HOST,
      port: process.env.DB_PORT || DB_CONFIG.DEFAULT_PORT,
      user: process.env.DB_USER || DB_CONFIG.DEFAULT_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || DB_CONFIG.DEFAULT_DB_NAME
    });
  }

  /**
   * Check if database already has data
   * @param {mysql.Connection} connection - Database connection
   * @returns {boolean} True if database has data
   */
  static async hasExistingData(connection) {
    try {
      const count = await DatabaseUtils.getTableRowCount(connection, 'questionnaires');
      return count > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Run database seeds
   * @param {mysql.Connection} connection - Database connection
   * @param {boolean} force - Force seeding even if data exists
   */
  static async runSeeds(connection, force = false) {
    // Check if data already exists
    if (!force && await this.hasExistingData(connection)) {
      console.log('⚠️  Database already contains data. Use --force to override.');
      return false;
    }

    const seedPath = path.join(__dirname, PATHS.SEEDS);
    await DatabaseUtils.executeSQLFile(connection, seedPath);
    console.log(MESSAGES.SEED.SEED_COMPLETE);
    return true;
  }

  /**
   * Get seeding statistics
   * @param {mysql.Connection} connection - Database connection
   * @returns {Object} Seeding statistics
   */
  static async getSeedingStats(connection) {
    const stats = {};
    
    for (const table of TABLES) {
      try {
        stats[table] = await DatabaseUtils.getTableRowCount(connection, table);
      } catch (error) {
        stats[table] = 0;
      }
    }

    return stats;
  }
}

module.exports = SeedUtils;
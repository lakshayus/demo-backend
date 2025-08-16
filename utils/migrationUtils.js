const mysql = require('mysql2/promise');
const path = require('path');
const DatabaseUtils = require('./dbUtils');
const { DB_CONFIG, PATHS, MESSAGES } = require('./constants');

class MigrationUtils {
  /**
   * Create database connection
   * @param {boolean} includeDatabase - Whether to include database in connection
   * @returns {mysql.Connection} Database connection
   */
  static async createConnection(includeDatabase = false) {
    const config = {
      host: process.env.DB_HOST || DB_CONFIG.DEFAULT_HOST,
      port: process.env.DB_PORT || DB_CONFIG.DEFAULT_PORT,
      user: process.env.DB_USER || DB_CONFIG.DEFAULT_USER,
      password: process.env.DB_PASSWORD || '',
    };

    if (includeDatabase) {
      config.database = process.env.DB_NAME || DB_CONFIG.DEFAULT_DB_NAME;
    }

    return await mysql.createConnection(config);
  }

  /**
   * Create database if it doesn't exist
   * @param {mysql.Connection} connection - Database connection
   * @param {string} dbName - Database name
   */
  static async createDatabase(connection, dbName) {
    const sql = `CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET ${DB_CONFIG.CHARSET} COLLATE ${DB_CONFIG.COLLATION}`;
    await connection.execute(sql);
    console.log(`${MESSAGES.SETUP.DB_CREATED}: '${dbName}'`);
  }

  /**
   * Run database migrations
   * @param {mysql.Connection} connection - Database connection
   */
  static async runMigrations(connection) {
    const schemaPath = path.join(__dirname, PATHS.SCHEMA);
    await DatabaseUtils.executeSQLFile(connection, schemaPath);
    console.log(MESSAGES.SETUP.SCHEMA_CREATED);
  }

  /**
   * Validate database setup
   * @param {mysql.Connection} connection - Database connection
   */
  static async validateSetup(connection) {
    const { TABLES } = require('./constants');
    const missingTables = [];

    for (const table of TABLES) {
      const exists = await DatabaseUtils.tableExists(connection, table);
      if (!exists) {
        missingTables.push(table);
      }
    }

    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }

    return true;
  }
}

module.exports = MigrationUtils;
const fs = require('fs').promises;
const path = require('path');

class DatabaseUtils {
  /**
   * Execute SQL file by splitting statements and running them
   * @param {mysql.Connection} connection - Database connection
   * @param {string} filePath - Path to SQL file
   */
  static async executeSQLFile(connection, filePath) {
    try {
      const sql = await fs.readFile(filePath, 'utf8');
      const statements = this.splitSQLStatements(sql);
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await connection.execute(statement);
          } catch (error) {
            if (!error.message.includes('already exists')) {
              console.error('Error executing statement:', statement.substring(0, 100) + '...');
              throw error;
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error executing SQL file:', filePath, error.message);
      throw error;
    }
  }

  /**
   * Split SQL content into individual statements
   * @param {string} sql - SQL content
   * @returns {Array<string>} Array of SQL statements
   */
  static splitSQLStatements(sql) {
    return sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => 
        stmt.length > 0 && 
        !stmt.startsWith('--') && 
        !stmt.startsWith('USE') &&
        !stmt.startsWith('/*')
      );
  }

  /**
   * Check if database exists
   * @param {mysql.Connection} connection - Database connection
   * @param {string} dbName - Database name
   * @returns {boolean} True if database exists
   */
  static async databaseExists(connection, dbName) {
    try {
      const [rows] = await connection.execute(
        'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
        [dbName]
      );
      return rows.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if table exists
   * @param {mysql.Connection} connection - Database connection
   * @param {string} tableName - Table name
   * @returns {boolean} True if table exists
   */
  static async tableExists(connection, tableName) {
    try {
      const [rows] = await connection.execute(
        'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
        [process.env.DB_NAME || 'framtt_demo', tableName]
      );
      return rows.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get table row count
   * @param {mysql.Connection} connection - Database connection
   * @param {string} tableName - Table name
   * @returns {number} Row count
   */
  static async getTableRowCount(connection, tableName) {
    try {
      const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      return rows[0].count;
    } catch (error) {
      return 0;
    }
  }
}

module.exports = DatabaseUtils;
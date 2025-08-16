const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const useDatabase = process.env.USE_DATABASE === 'true';

let pool = null;

if (useDatabase) {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'framtt_demo',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
    // ❌ Removed acquireTimeout, timeout, reconnect (invalid in mysql2)
  };

  pool = mysql.createPool(dbConfig);

  // Test connection
  (async function testConnection() {
    try {
      const connection = await pool.getConnection();
      console.log('✅ Database connected successfully');
      connection.release();
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      // If DB is optional, don't exit
      if (useDatabase) process.exit(1);
    }
  })();
} else {
  console.log('⚠️ Database is disabled (USE_DATABASE=false). Running without DB.');
}

// Helper function to execute queries
async function query(sql, params = []) {
  if (!pool) throw new Error('Database not enabled. Set USE_DATABASE=true in .env');
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper function to execute transactions
async function transaction(queries) {
  if (!pool) throw new Error('Database not enabled. Set USE_DATABASE=true in .env');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const results = [];
    for (const { sql, params } of queries) {
      const [result] = await connection.execute(sql, params);
      results.push(result);
    }

    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  query,
  transaction
};

// config/database.js
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const useDatabase = process.env.USE_DATABASE === 'true';
let pool = null;

if (useDatabase) {
  if (!process.env.DATABASE_URL) {
    console.error('❌ USE_DATABASE=true but DATABASE_URL is missing in .env');
  } else {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // ✅ let pg handle SSL
      max: 5,
      family: 4
    });
  }
} else {
  console.log('⚠️ Database is disabled (USE_DATABASE=false). Running without DB.');
}

// Convert MySQL-style ? → $1, $2 ...
function toPositional(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function query(sql, params = []) {
  if (!pool) throw new Error('Database not enabled. Set USE_DATABASE=true in .env');
  const text = process.env.MYSQL_STYLE_PARAMS === 'true' ? toPositional(sql) : sql;
  const result = await pool.query(text, params);
  return result.rows;
}

async function transaction(queries) {
  if (!pool) throw new Error('Database not enabled. Set USE_DATABASE=true in .env');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const results = [];
    for (const { sql, params = [] } of queries) {
      const text = process.env.MYSQL_STYLE_PARAMS === 'true' ? toPositional(sql) : sql;
      const res = await client.query(text, params);
      results.push(res.rows);
    }
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function testConnection() {
  if (!pool) {
    console.log('⚠️ No database pool initialized.');
    return;
  }
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully at', result.rows[0].now);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

module.exports = { pool, query, transaction, testConnection };

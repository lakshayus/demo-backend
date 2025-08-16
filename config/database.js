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
    // Ensure sslmode=require in case it's not in the env
    const connectionString = process.env.DATABASE_URL.includes('sslmode=')
      ? process.env.DATABASE_URL
      : `${process.env.DATABASE_URL}?sslmode=require`;

    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // required for Supabase
      max: 5, // safe for Render
      family: 4 // ✅ force IPv4 to avoid ENETUNREACH
    });
  }
} else {
  console.log('⚠️ Database is disabled (USE_DATABASE=false). Running without DB.');
}

// Convert MySQL-style `?` placeholders → Postgres `$1, $2...`
function toPositional(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// Run single query
async function query(sql, params = []) {
  if (!pool) throw new Error('Database not enabled. Set USE_DATABASE=true in .env');
  const text = process.env.MYSQL_STYLE_PARAMS === 'true' ? toPositional(sql) : sql;
  const result = await pool.query(text, params);
  return result.rows;
}

// Run transaction
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

// Optional: export a test function instead of crashing app on startup
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

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
};

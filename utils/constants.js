// Database configuration constants
const DB_CONFIG = {
  DEFAULT_HOST: 'localhost',
  DEFAULT_PORT: 3306,
  DEFAULT_USER: 'root',
  DEFAULT_DB_NAME: 'framtt_demo',
  CHARSET: 'utf8mb4',
  COLLATION: 'utf8mb4_unicode_ci'
};

// File paths
const PATHS = {
  SCHEMA: '../../database/migrations/001_initial_schema.sql',
  SEEDS: '../../database/seeds/sample_data.sql',
  DATABASE_DIR: '../../database',
  MIGRATIONS_DIR: '../../database/migrations',
  SEEDS_DIR: '../../database/seeds'
};

// Setup messages
const MESSAGES = {
  SETUP: {
    START: '🚀 Setting up Framtt Backend Database...',
    DB_CONNECTED: '✅ Connected to MySQL server',
    DB_CREATED: '✅ Database created or already exists',
    SCHEMA_CREATED: '✅ Database schema created successfully',
    SETUP_COMPLETE: '🎉 Database setup completed successfully!',
    SETUP_FAILED: '❌ Database setup failed:'
  },
  SEED: {
    START: '🌱 Seeding database with sample data...',
    CONNECTED: '✅ Connected to database',
    SEED_COMPLETE: '✅ Sample data inserted successfully',
    SEED_FAILED: '❌ Database seeding failed:'
  },
  NEXT_STEPS: [
    '1. Update your .env file with correct database credentials',
    '2. Run: npm run db:seed (optional - adds sample data)',
    '3. Run: npm start or npm run dev'
  ]
};

// Required environment variables
const REQUIRED_ENV_VARS = [
  'DB_HOST',
  'DB_USER', 
  'DB_NAME',
  'JWT_SECRET'
];

// Sample tables for validation
const TABLES = [
  'questionnaires',
  'demo_requests', 
  'leads',
  'lead_activities',
  'analytics_summary',
  'users'
];

module.exports = {
  DB_CONFIG,
  PATHS,
  MESSAGES,
  REQUIRED_ENV_VARS,
  TABLES
};
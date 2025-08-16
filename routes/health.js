const express = require('express');
const router = express.Router();

const healthController = require('../controllers/healthController');
const { asyncHandler } = require('../middleware/errorHandler');
const db = require('../config/database'); // ✅ import your database.js

// Health check routes
router.get('/', asyncHandler(healthController.healthCheck));
router.get('/detailed', asyncHandler(healthController.detailedHealthCheck));

// ✅ DB test route
router.get('/db-test', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()'); // works for Postgres
    res.json({
      success: true,
      databaseTime: result[0].now || result[0].now(), // Postgres returns `now`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Optional catch-all for undefined health routes
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Health endpoint not found',
    availableEndpoints: ['/', '/detailed', '/db-test'],
  });
});

module.exports = router;

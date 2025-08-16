const express = require('express');
const router = express.Router();

const healthController = require('../controllers/healthController');
const { asyncHandler } = require('../middleware/errorHandler');
const db = require('../config/database'); // ✅ import your database.js

// Basic health check
router.get('/', asyncHandler(healthController.healthCheck));

// Detailed health check
router.get('/detailed', asyncHandler(healthController.detailedHealthCheck));

// ✅ DB test route
router.get('/db-test', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()'); // returns rows array
    res.json({
      success: true,
      databaseTime: result[0]?.now || null, // ✅ correct indexing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Catch-all for undefined health routes
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Health endpoint not found',
    availableEndpoints: ['/', '/detailed', '/db-test'],
  });
});

module.exports = router;

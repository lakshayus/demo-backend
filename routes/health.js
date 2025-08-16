const express = require('express');
const router = express.Router();

const healthController = require('../controllers/healthController');
const { asyncHandler } = require('../middleware/errorHandler');

// Health check routes
router.get('/', asyncHandler(healthController.healthCheck));
router.get('/detailed', asyncHandler(healthController.detailedHealthCheck));

// Optional catch-all for undefined health routes
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Health endpoint not found',
    availableEndpoints: ['/', '/detailed'],
  });
});

module.exports = router; // ✅ export only the router

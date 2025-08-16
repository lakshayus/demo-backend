const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const { asyncHandler } = require('../middleware/errorHandler');

// Health check routes
router.get('/', asyncHandler(healthController.healthCheck));
router.get('/detailed', asyncHandler(healthController.detailedHealthCheck));

module.exports = router;
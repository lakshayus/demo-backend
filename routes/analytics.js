const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { asyncHandler } = require('../middleware/errorHandler');

// All analytics routes require authentication
router.get('/overview', asyncHandler(analyticsController.getOverview));
router.get('/questionnaires', asyncHandler(analyticsController.getQuestionnaireAnalytics));
router.get('/demo-requests', asyncHandler(analyticsController.getDemoRequestAnalytics));
router.get('/leads', asyncHandler(analyticsController.getLeadAnalytics));
router.get('/conversion-funnel', asyncHandler(analyticsController.getConversionFunnel));

module.exports = router;
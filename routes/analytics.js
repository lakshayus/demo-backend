const express = require('express');
const router = express.Router();

const analyticsController = require('../controllers/analyticsController');
const { asyncHandler } = require('../middleware/errorHandler');

// All analytics routes require authentication (handled in server.js with app.use('/api/analytics', authenticate, ...))

// Overview analytics
router.get('/overview', asyncHandler(analyticsController.getOverview));

// Questionnaire analytics
router.get('/questionnaires', asyncHandler(analyticsController.getQuestionnaireAnalytics));

// Demo request analytics
router.get('/demo-requests', asyncHandler(analyticsController.getDemoRequestAnalytics));

// Leads analytics
router.get('/leads', asyncHandler(analyticsController.getLeadAnalytics));

// Conversion funnel
router.get('/conversion-funnel', asyncHandler(analyticsController.getConversionFunnel));

// Optional catch-all inside analytics router
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Analytics endpoint not found',
    availableEndpoints: [
      '/overview',
      '/questionnaires',
      '/demo-requests',
      '/leads',
      '/conversion-funnel'
    ]
  });
});

module.exports = router; // ✅ export only the router

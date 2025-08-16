const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const questionnaireController = require('../controllers/questionnaireController');
const { asyncHandler } = require('../middleware/errorHandler');
const { optionalAuth } = require('../middleware/auth');

// Rate limiting for questionnaire submissions
const submitLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // limit each IP to 3 requests per minute
  message: {
    error: 'Too many questionnaire submissions',
    message: 'Please wait a moment before submitting another questionnaire.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation rules for questionnaire submission
const validateQuestionnaireSubmission = [
  body('sessionId')
    .optional()
    .isUUID()
    .withMessage('Invalid session ID format'),

  body('monitorRevenue')
    .isBoolean()
    .withMessage('monitorRevenue must be a boolean'),

  body('seamlessCustomerChat')
    .isBoolean()
    .withMessage('seamlessCustomerChat must be a boolean'),

  body('trackVehiclesLive')
    .isBoolean()
    .withMessage('trackVehiclesLive must be a boolean'),

  body('useWhatsApp')
    .isBoolean()
    .withMessage('useWhatsApp must be a boolean'),

  body('spendOnMarketing')
    .isBoolean()
    .withMessage('spendOnMarketing must be a boolean'),

  body('useRentalSoftware')
    .isBoolean()
    .withMessage('useRentalSoftware must be a boolean'),

  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

// Routes

// Submit questionnaire
router.post(
  '/submit',
  submitLimit,
  validateQuestionnaireSubmission,
  asyncHandler(questionnaireController.submitQuestionnaire)
);

// Get solutions by sessionId
router.get(
  '/solutions/:sessionId',
  asyncHandler(questionnaireController.getSolutions)
);

// Get questionnaire by sessionId
router.get(
  '/:sessionId',
  asyncHandler(questionnaireController.getQuestionnaire)
);

// Admin: get all questionnaires (requires auth if available)
router.get(
  '/',
  optionalAuth,
  asyncHandler(questionnaireController.getAllQuestionnaires)
);

// Admin: analytics overview (requires auth if available)
router.get(
  '/analytics/overview',
  optionalAuth,
  asyncHandler(questionnaireController.getAnalytics)
);

module.exports = router; // ✅ important: export ONLY the router

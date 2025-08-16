const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const demoController = require('../controllers/demoController');
const { asyncHandler } = require('../middleware/errorHandler');

// Rate limiting for demo requests
const demoRequestLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // limit each IP to 3 requests per 5 minutes
  message: {
    error: 'Too many demo requests',
    message: 'Please wait before submitting another demo request.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation rules for demo request
const validateDemoRequest = [
  body('type').isIn(['general', 'module', 'full', 'pricing']).withMessage('Invalid request type'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('company').optional().trim().isLength({ max: 200 }).withMessage('Company name too long'),
  body('phone').optional().trim().isMobilePhone().withMessage('Invalid phone number format'),
  body('vehicleCount').optional().isInt({ min: 0, max: 10000 }).withMessage('Invalid vehicle count'),
  body('timeline').optional().isIn(['immediately', '1_month', '3_months', '6_months', '1_year']).withMessage('Invalid timeline'),
  body('preferredContact').optional().isIn(['email', 'phone', 'whatsapp']).withMessage('Invalid contact preference'),
  body('sessionId').optional().isUUID().withMessage('Invalid session ID format'),
  body('moduleId').optional().isIn(['analytics', 'communication', 'tracking', 'whatsapp', 'marketing', 'booking']).withMessage('Invalid module ID'),
];

// Routes
router.post(
  '/request',
  demoRequestLimit,
  validateDemoRequest,
  asyncHandler(demoController.submitDemoRequest)
);

router.get(
  '/request/:requestId',
  asyncHandler(demoController.getDemoRequest)
);

module.exports = router;
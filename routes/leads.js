const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const leadController = require('../controllers/leadController');
const { asyncHandler } = require('../middleware/errorHandler');

// Validation rules for lead updates
const validateLeadUpdate = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('company').optional().trim().isLength({ max: 200 }).withMessage('Company name too long'),
  body('phone').optional().trim().isMobilePhone().withMessage('Invalid phone number format'),
  body('vehicleCount').optional().isInt({ min: 0, max: 10000 }).withMessage('Invalid vehicle count'),
  body('status').optional().isIn(['new', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).withMessage('Invalid status'),
  body('score').optional().isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  body('estimatedValue').optional().isFloat({ min: 0 }).withMessage('Invalid estimated value'),
];

// Routes (all require authentication)
router.get('/', asyncHandler(leadController.getAllLeads));
router.get('/analytics', asyncHandler(leadController.getAnalytics));
router.get('/:id', asyncHandler(leadController.getLeadById));
router.put('/:id', validateLeadUpdate, asyncHandler(leadController.updateLead));
router.post('/:id/activities', asyncHandler(leadController.addActivity));
router.get('/:id/activities', asyncHandler(leadController.getActivities));

module.exports = router;
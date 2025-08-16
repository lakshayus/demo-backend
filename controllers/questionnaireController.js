const { validationResult } = require('express-validator');
const Questionnaire = require('../models/Questionnaire');
const { AppError } = require('../middleware/errorHandler');

class QuestionnaireController {
  // Submit questionnaire responses
  async submitQuestionnaire(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid input data',
          details: errors.array()
        });
      }

      // Extract client information
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const referrer = req.headers.referer || req.headers.referrer;

      // Create questionnaire data
      const questionnaireData = {
        ...req.body,
        ipAddress,
        userAgent,
        referrer,
        completedAt: new Date()
      };

      // Save questionnaire
      const questionnaire = new Questionnaire(questionnaireData);
      await questionnaire.save();

      // Generate solutions based on answers
      const solutions = questionnaire.generateSolutions();

      res.status(201).json({
        success: true,
        message: 'Questionnaire submitted successfully',
        data: {
          sessionId: questionnaire.sessionId,
          solutions,
          totalSolutions: solutions.length,
          recommendedCount: solutions.filter(s => s.recommended).length
        }
      });
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to submit questionnaire'
      });
    }
  }

  // Get solutions for a specific session
  async getSolutions(req, res) {
    try {
      const { sessionId } = req.params;

      const questionnaire = await Questionnaire.findBySessionId(sessionId);
      if (!questionnaire) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Questionnaire not found for this session'
        });
      }

      const solutions = questionnaire.generateSolutions();

      res.json({
        success: true,
        data: {
          sessionId: questionnaire.sessionId,
          solutions,
          totalSolutions: solutions.length,
          recommendedCount: solutions.filter(s => s.recommended).length,
          completedAt: questionnaire.completedAt
        }
      });
    } catch (error) {
      console.error('Error getting solutions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve solutions'
      });
    }
  }

  // Get questionnaire by session ID
  async getQuestionnaire(req, res) {
    try {
      const { sessionId } = req.params;

      const questionnaire = await Questionnaire.findBySessionId(sessionId);
      if (!questionnaire) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Questionnaire not found for this session'
        });
      }

      // Remove sensitive information
      const safeQuestionnaire = {
        sessionId: questionnaire.sessionId,
        monitorRevenue: questionnaire.monitorRevenue,
        seamlessCustomerChat: questionnaire.seamlessCustomerChat,
        trackVehiclesLive: questionnaire.trackVehiclesLive,
        useWhatsApp: questionnaire.useWhatsApp,
        spendOnMarketing: questionnaire.spendOnMarketing,
        useRentalSoftware: questionnaire.useRentalSoftware,
        completedAt: questionnaire.completedAt
      };

      res.json({
        success: true,
        data: safeQuestionnaire
      });
    } catch (error) {
      console.error('Error getting questionnaire:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve questionnaire'
      });
    }
  }

  // Get all questionnaires (admin only)
  async getAllQuestionnaires(req, res) {
    try {
      // Check if user is authenticated for admin access
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required for this endpoint'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const filters = {
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };

      const result = await Questionnaire.findAll(page, limit, filters);

      res.json({
        success: true,
        data: result.questionnaires,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting all questionnaires:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve questionnaires'
      });
    }
  }

  // Get analytics (admin only)
  async getAnalytics(req, res) {
    try {
      // Check if user is authenticated for admin access
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required for this endpoint'
        });
      }

      const dateFrom = req.query.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const dateTo = req.query.dateTo || new Date().toISOString();

      const analytics = await Questionnaire.getAnalytics(dateFrom, dateTo);

      res.json({
        success: true,
        data: {
          period: {
            from: dateFrom,
            to: dateTo
          },
          ...analytics
        }
      });
    } catch (error) {
      console.error('Error getting questionnaire analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve analytics'
      });
    }
  }
}

module.exports = new QuestionnaireController();
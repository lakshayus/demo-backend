const { validationResult } = require('express-validator');
const Lead = require('../models/Lead');
const { AppError } = require('../middleware/errorHandler');

class LeadController {
  // Get all leads with pagination and filters
  async getAllLeads(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const filters = {
        status: req.query.status,
        assignedTo: req.query.assignedTo,
        minScore: req.query.minScore,
        source: req.query.source,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };

      const result = await Lead.findAll(page, limit, filters);

      res.json({
        success: true,
        data: result.leads,
        pagination: result.pagination,
        filters: filters
      });
    } catch (error) {
      console.error('Error getting leads:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve leads'
      });
    }
  }

  // Get lead by ID
  async getLeadById(req, res) {
    try {
      const { id } = req.params;
      const lead = await Lead.findById(id);

      if (!lead) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Lead not found'
        });
      }

      res.json({
        success: true,
        data: lead
      });
    } catch (error) {
      console.error('Error getting lead by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve lead'
      });
    }
  }

  // Update lead
  async updateLead(req, res) {
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

      const { id } = req.params;
      const lead = await Lead.findById(id);

      if (!lead) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Lead not found'
        });
      }

      // Update lead properties
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined && key !== 'id' && key !== 'leadId') {
          lead[key] = req.body[key];
        }
      });

      lead.updatedAt = new Date();

      // Update score if relevant fields changed
      if (['company', 'website', 'vehicleCount', 'phone', 'email', 'currentRevenue', 'budget', 'timeline', 'decisionMaker', 'painPoints'].some(field => req.body[field] !== undefined)) {
        await lead.updateScore();
      }

      await lead.save();

      // Add activity for the update
      const changedFields = Object.keys(req.body).filter(key => req.body[key] !== undefined);
      await lead.addActivity('updated', `Lead updated: ${changedFields.join(', ')}`, req.user?.id);

      res.json({
        success: true,
        message: 'Lead updated successfully',
        data: lead
      });
    } catch (error) {
      console.error('Error updating lead:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update lead'
      });
    }
  }

  // Add activity to lead
  async addActivity(req, res) {
    try {
      const { id } = req.params;
      const { type, description } = req.body;

      if (!type || !description) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Type and description are required'
        });
      }

      const lead = await Lead.findById(id);
      if (!lead) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Lead not found'
        });
      }

      await lead.addActivity(type, description, req.user?.id);

      res.status(201).json({
        success: true,
        message: 'Activity added successfully'
      });
    } catch (error) {
      console.error('Error adding lead activity:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to add activity'
      });
    }
  }

  // Get lead activities
  async getActivities(req, res) {
    try {
      const { id } = req.params;
      const lead = await Lead.findById(id);

      if (!lead) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Lead not found'
        });
      }

      const activities = await lead.getActivities();

      res.json({
        success: true,
        data: activities
      });
    } catch (error) {
      console.error('Error getting lead activities:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve activities'
      });
    }
  }

  // Get lead analytics
  async getAnalytics(req, res) {
    try {
      const dateFrom = req.query.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const dateTo = req.query.dateTo || new Date().toISOString();

      const analytics = await Lead.getAnalytics(dateFrom, dateTo);

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
      console.error('Error getting lead analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve lead analytics'
      });
    }
  }
}

module.exports = new LeadController();
const { validationResult } = require('express-validator');
const DemoRequest = require('../models/DemoRequest');
const Lead = require('../models/Lead');
const emailService = require('../services/emailService');

class DemoController {
  // Submit demo request
  async submitDemoRequest(req, res) {
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

      // Create demo request data
      const demoRequestData = {
        ...req.body,
        ipAddress,
        userAgent,
        referrer
      };

      // Save demo request
      const demoRequest = new DemoRequest(demoRequestData);
      await demoRequest.save();

      // Create or update lead if email provided
      let lead = null;
      if (demoRequest.email) {
        try {
          // Check if lead already exists
          lead = await Lead.findByEmail(demoRequest.email);
          
          if (lead) {
            // Update existing lead
            lead.name = demoRequest.name || lead.name;
            lead.company = demoRequest.company || lead.company;
            lead.phone = demoRequest.phone || lead.phone;
            lead.vehicleCount = demoRequest.vehicleCount || lead.vehicleCount;
            lead.timeline = demoRequest.timeline || lead.timeline;
            lead.demoRequestId = demoRequest.id;
            lead.lastContactDate = new Date();
            lead.updatedAt = new Date();
            
            // Update lead score
            await lead.updateScore();
            await lead.save();
            
            // Add activity
            await lead.addActivity('demo_request', `New demo request: ${demoRequest.type}`);
          } else {
            // Create new lead
            const leadData = {
              sessionId: demoRequest.sessionId,
              demoRequestId: demoRequest.id,
              name: demoRequest.name,
              email: demoRequest.email,
              company: demoRequest.company,
              phone: demoRequest.phone,
              vehicleCount: demoRequest.vehicleCount,
              timeline: demoRequest.timeline,
              painPoints: demoRequest.currentChallenges,
              source: 'website',
              status: 'new'
            };
            
            lead = new Lead(leadData);
            await lead.updateScore();
            await lead.save();
            
            // Add initial activity
            await lead.addActivity('created', `Lead created from demo request: ${demoRequest.type}`);
          }
        } catch (leadError) {
          console.error('Error handling lead:', leadError);
          // Continue even if lead creation fails
        }
      }

      // Send notification emails
      try {
        if (process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true') {
          // Send confirmation to user
          if (demoRequest.email) {
            await emailService.sendDemoConfirmation(demoRequest);
          }

          // Send notification to sales team
          await emailService.sendDemoNotification(demoRequest);
        }
      } catch (emailError) {
        console.error('Error sending email notifications:', emailError);
        // Continue even if email fails
      }

      res.status(201).json({
        success: true,
        message: 'Demo request submitted successfully',
        data: {
          requestId: demoRequest.requestId,
          type: demoRequest.type,
          status: demoRequest.status,
          estimatedResponseTime: '24 hours',
          nextSteps: this.getNextSteps(demoRequest.type)
        }
      });
    } catch (error) {
      console.error('Error submitting demo request:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to submit demo request'
      });
    }
  }

  // Get demo request by request ID
  async getDemoRequest(req, res) {
    try {
      const { requestId } = req.params;

      const demoRequest = await DemoRequest.findByRequestId(requestId);
      if (!demoRequest) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Demo request not found'
        });
      }

      // Return safe data (no sensitive information)
      const safeData = {
        requestId: demoRequest.requestId,
        type: demoRequest.type,
        status: demoRequest.status,
        createdAt: demoRequest.createdAt,
        estimatedResponseTime: '24 hours',
        nextSteps: this.getNextSteps(demoRequest.type)
      };

      res.json({
        success: true,
        data: safeData
      });
    } catch (error) {
      console.error('Error getting demo request:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve demo request'
      });
    }
  }

  // Helper method to get next steps based on request type
  getNextSteps(type) {
    const steps = {
      general: [
        'Our sales team will review your request',
        'You\'ll receive a call within 24 hours',
        'We\'ll schedule a personalized demo'
      ],
      module: [
        'We\'ll prepare a focused demo of the requested module',
        'Our specialist will contact you within 24 hours',
        'You\'ll see exactly how this feature works for your business'
      ],
      full: [
        'We\'ll create a comprehensive demo experience',
        'Our team will contact you to understand your specific needs',
        'We\'ll schedule a detailed walkthrough of all features'
      ],
      pricing: [
        'Our sales team will prepare a customized quote',
        'You\'ll receive pricing information within 24 hours',
        'We\'ll discuss implementation timeline and options'
      ]
    };

    return steps[type] || steps.general;
  }
}

module.exports = new DemoController();
const Questionnaire = require('../models/Questionnaire');
const DemoRequest = require('../models/DemoRequest');
const Lead = require('../models/Lead');
const { query } = require('../config/database');

class AnalyticsController {
  // Get overview analytics
  async getOverview(req, res) {
    try {
      const dateFrom = req.query.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const dateTo = req.query.dateTo || new Date().toISOString();

      const [
        questionnaireAnalytics,
        demoRequestAnalytics,
        leadAnalytics
      ] = await Promise.all([
        Questionnaire.getAnalytics(dateFrom, dateTo),
        DemoRequest.getAnalytics(dateFrom, dateTo),
        Lead.getAnalytics(dateFrom, dateTo)
      ]);

      // Calculate conversion rates
      const conversionRate = questionnaireAnalytics.totalResponses > 0 
        ? ((demoRequestAnalytics.totalRequests / questionnaireAnalytics.totalResponses) * 100).toFixed(2)
        : 0;

      const qualificationRate = demoRequestAnalytics.totalRequests > 0
        ? ((leadAnalytics.totalLeads / demoRequestAnalytics.totalRequests) * 100).toFixed(2)
        : 0;

      res.json({
        success: true,
        data: {
          period: {
            from: dateFrom,
            to: dateTo
          },
          summary: {
            totalQuestionnaires: questionnaireAnalytics.totalResponses,
            totalDemoRequests: demoRequestAnalytics.totalRequests,
            totalLeads: leadAnalytics.totalLeads,
            conversionRate: `${conversionRate}%`,
            qualificationRate: `${qualificationRate}%`,
            pipelineValue: leadAnalytics.funnel.total_pipeline_value || 0,
            closedValue: leadAnalytics.funnel.closed_value || 0
          },
          questionnaires: questionnaireAnalytics,
          demoRequests: demoRequestAnalytics,
          leads: leadAnalytics
        }
      });
    } catch (error) {
      console.error('Error getting overview analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve analytics overview'
      });
    }
  }

  // Get questionnaire-specific analytics
  async getQuestionnaireAnalytics(req, res) {
    try {
      const dateFrom = req.query.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const dateTo = req.query.dateTo || new Date().toISOString();

      const analytics = await Questionnaire.getAnalytics(dateFrom, dateTo);

      res.json({
        success: true,
        data: {
          period: { from: dateFrom, to: dateTo },
          ...analytics
        }
      });
    } catch (error) {
      console.error('Error getting questionnaire analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve questionnaire analytics'
      });
    }
  }

  // Get demo request analytics
  async getDemoRequestAnalytics(req, res) {
    try {
      const dateFrom = req.query.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const dateTo = req.query.dateTo || new Date().toISOString();

      const analytics = await DemoRequest.getAnalytics(dateFrom, dateTo);

      res.json({
        success: true,
        data: {
          period: { from: dateFrom, to: dateTo },
          ...analytics
        }
      });
    } catch (error) {
      console.error('Error getting demo request analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve demo request analytics'
      });
    }
  }

  // Get lead analytics
  async getLeadAnalytics(req, res) {
    try {
      const dateFrom = req.query.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const dateTo = req.query.dateTo || new Date().toISOString();

      const analytics = await Lead.getAnalytics(dateFrom, dateTo);

      res.json({
        success: true,
        data: {
          period: { from: dateFrom, to: dateTo },
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

  // Get conversion funnel analytics
  async getConversionFunnel(req, res) {
    try {
      const dateFrom = req.query.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const dateTo = req.query.dateTo || new Date().toISOString();

      // Get funnel data
      const funnelSql = `
        SELECT 
          'Questionnaires' as stage,
          COUNT(DISTINCT q.id) as count,
          0 as stage_order
        FROM questionnaires q
        WHERE q.created_at BETWEEN ? AND ?
        
        UNION ALL
        
        SELECT 
          'Demo Requests' as stage,
          COUNT(DISTINCT dr.id) as count,
          1 as stage_order
        FROM demo_requests dr
        WHERE dr.created_at BETWEEN ? AND ?
        
        UNION ALL
        
        SELECT 
          'Qualified Leads' as stage,
          COUNT(DISTINCT l.id) as count,
          2 as stage_order
        FROM leads l
        WHERE l.created_at BETWEEN ? AND ?
        AND l.status IN ('qualified', 'proposal', 'negotiation', 'closed_won')
        
        UNION ALL
        
        SELECT 
          'Closed Won' as stage,
          COUNT(DISTINCT l.id) as count,
          3 as stage_order
        FROM leads l
        WHERE l.created_at BETWEEN ? AND ?
        AND l.status = 'closed_won'
        
        ORDER BY stage_order
      `;

      const funnelData = await query(funnelSql, [
        dateFrom, dateTo, // Questionnaires
        dateFrom, dateTo, // Demo Requests
        dateFrom, dateTo, // Qualified Leads
        dateFrom, dateTo  // Closed Won
      ]);

      // Calculate conversion rates
      const conversions = [];
      for (let i = 0; i < funnelData.length - 1; i++) {
        const current = funnelData[i];
        const next = funnelData[i + 1];
        const rate = current.count > 0 ? ((next.count / current.count) * 100).toFixed(2) : 0;
        
        conversions.push({
          from: current.stage,
          to: next.stage,
          rate: `${rate}%`,
          fromCount: current.count,
          toCount: next.count
        });
      }

      res.json({
        success: true,
        data: {
          period: { from: dateFrom, to: dateTo },
          funnel: funnelData,
          conversions
        }
      });
    } catch (error) {
      console.error('Error getting conversion funnel:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve conversion funnel'
      });
    }
  }
}

module.exports = new AnalyticsController();
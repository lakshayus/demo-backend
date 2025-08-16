const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Questionnaire {
  constructor(data) {
    this.id = data.id || null;
    this.sessionId = data.sessionId || uuidv4();
    this.monitorRevenue = data.monitorRevenue || false;
    this.seamlessCustomerChat = data.seamlessCustomerChat || false;
    this.trackVehiclesLive = data.trackVehiclesLive || false;
    this.useWhatsApp = data.useWhatsApp || false;
    this.spendOnMarketing = data.spendOnMarketing || false;
    this.useRentalSoftware = data.useRentalSoftware || false;
    this.ipAddress = data.ipAddress || null;
    this.userAgent = data.userAgent || null;
    this.referrer = data.referrer || null;
    this.completedAt = data.completedAt || new Date();
    this.createdAt = data.createdAt || new Date();
  }

  // Save questionnaire response to database
  async save() {
    try {
      const sql = `
        INSERT INTO questionnaires (
          session_id, monitor_revenue, seamless_customer_chat, 
          track_vehicles_live, use_whatsapp, spend_on_marketing, 
          use_rental_software, ip_address, user_agent, referrer,
          completed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        this.sessionId,
        this.monitorRevenue,
        this.seamlessCustomerChat,
        this.trackVehiclesLive,
        this.useWhatsApp,
        this.spendOnMarketing,
        this.useRentalSoftware,
        this.ipAddress,
        this.userAgent,
        this.referrer,
        this.completedAt,
        this.createdAt
      ];

      const result = await query(sql, params);
      this.id = result.insertId;
      return this;
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      throw error;
    }
  }

  // Find questionnaire by session ID
  static async findBySessionId(sessionId) {
    try {
      const sql = 'SELECT * FROM questionnaires WHERE session_id = ? ORDER BY created_at DESC LIMIT 1';
      const results = await query(sql, [sessionId]);
      
      if (results.length === 0) {
        return null;
      }

      return new Questionnaire(results[0]);
    } catch (error) {
      console.error('Error finding questionnaire by session ID:', error);
      throw error;
    }
  }

  // Get all questionnaires with pagination
  static async findAll(page = 1, limit = 50, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = '1 = 1';
      let params = [];

      // Apply filters
      if (filters.dateFrom) {
        whereClause += ' AND created_at >= ?';
        params.push(filters.dateFrom);
      }
      if (filters.dateTo) {
        whereClause += ' AND created_at <= ?';
        params.push(filters.dateTo);
      }

      const sql = `
        SELECT * FROM questionnaires 
        WHERE ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      params.push(limit, offset);
      const results = await query(sql, params);

      // Get total count
      const countSql = `SELECT COUNT(*) as total FROM questionnaires WHERE ${whereClause}`;
      const countResult = await query(countSql, params.slice(0, -2));
      const total = countResult[0].total;

      return {
        questionnaires: results.map(row => new Questionnaire(row)),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      console.error('Error finding questionnaires:', error);
      throw error;
    }
  }

  // Generate solution recommendations based on answers
  generateSolutions() {
    const solutions = [];

    if (this.monitorRevenue) {
      solutions.push({
        id: 'analytics',
        title: 'Revenue & Analytics Dashboard',
        description: 'See performance at a glance with real-time insights',
        priority: 'high',
        recommended: true
      });
    }

    if (this.seamlessCustomerChat) {
      solutions.push({
        id: 'communication',
        title: 'Smart Customer Communication',
        description: 'Streamlined customer support and booking management',
        priority: 'high',
        recommended: true
      });
    }

    if (this.trackVehiclesLive) {
      solutions.push({
        id: 'tracking',
        title: 'Live Vehicle Tracking',
        description: 'Real-time GPS tracking & status updates',
        priority: 'high',
        recommended: true
      });
    }

    if (this.useWhatsApp) {
      solutions.push({
        id: 'whatsapp',
        title: 'WhatsApp Booking Integration',
        description: 'Talk to customers directly through WhatsApp',
        priority: 'high',
        recommended: true
      });
    }

    if (this.spendOnMarketing) {
      solutions.push({
        id: 'marketing',
        title: 'AI Marketing Optimization',
        description: 'Spend less, convert more using auto-campaigns',
        priority: 'medium',
        recommended: true
      });
    }

    // Always include booking engine
    solutions.push({
      id: 'booking',
      title: 'Smart Booking Engine',
      description: 'Manage all rentals in one dashboard',
      priority: 'medium',
      recommended: false
    });

    // Add website if they don't use rental software
    if (!this.useRentalSoftware) {
      solutions.push({
        id: 'website',
        title: 'Custom Website Subdomain',
        description: 'Professional website for customers without existing sites',
        priority: 'low',
        recommended: false
      });
    }

    return solutions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Get analytics for questionnaire responses
  static async getAnalytics(dateFrom, dateTo) {
    try {
      const params = [dateFrom, dateTo];
      
      // Total responses
      const totalSql = 'SELECT COUNT(*) as total FROM questionnaires WHERE created_at BETWEEN ? AND ?';
      const totalResult = await query(totalSql, params);

      // Feature popularity
      const featuresSql = `
        SELECT 
          SUM(monitor_revenue) as revenue_count,
          SUM(seamless_customer_chat) as chat_count,
          SUM(track_vehicles_live) as tracking_count,
          SUM(use_whatsapp) as whatsapp_count,
          SUM(spend_on_marketing) as marketing_count,
          SUM(use_rental_software) as software_count
        FROM questionnaires 
        WHERE created_at BETWEEN ? AND ?
      `;
      const featuresResult = await query(featuresSql, params);

      // Daily responses
      const dailySql = `
        SELECT 
          DATE(created_at) as date, 
          COUNT(*) as count
        FROM questionnaires 
        WHERE created_at BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;
      const dailyResult = await query(dailySql, params);

      return {
        totalResponses: totalResult[0].total,
        features: featuresResult[0],
        dailyResponses: dailyResult
      };
    } catch (error) {
      console.error('Error getting questionnaire analytics:', error);
      throw error;
    }
  }
}

module.exports = Questionnaire;
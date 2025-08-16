const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Lead {
  constructor(data) {
    this.id = data.id || null;
    this.leadId = data.leadId || uuidv4();
    this.sessionId = data.sessionId || null;
    this.demoRequestId = data.demoRequestId || null;
    this.name = data.name || null;
    this.email = data.email || null;
    this.company = data.company || null;
    this.phone = data.phone || null;
    this.website = data.website || null;
    this.industry = data.industry || 'car_rental';
    this.companySize = data.companySize || null;
    this.vehicleCount = data.vehicleCount || null;
    this.currentRevenue = data.currentRevenue || null;
    this.currentSoftware = data.currentSoftware || null;
    this.painPoints = data.painPoints || null;
    this.budget = data.budget || null;
    this.timeline = data.timeline || null;
    this.decisionMaker = data.decisionMaker || null;
    this.source = data.source || 'website'; // 'website', 'referral', 'social', 'email'
    this.status = data.status || 'new'; // 'new', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
    this.score = data.score || 0; // Lead scoring 0-100
    this.assignedTo = data.assignedTo || null;
    this.tags = data.tags || null; // JSON array of tags
    this.lastContactDate = data.lastContactDate || null;
    this.nextFollowUp = data.nextFollowUp || null;
    this.estimatedValue = data.estimatedValue || null;
    this.notes = data.notes || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Save lead to database
  async save() {
    try {
      if (this.id) {
        // Update existing record
        const sql = `
          UPDATE leads SET
            name = ?, email = ?, company = ?, phone = ?, website = ?,
            industry = ?, company_size = ?, vehicle_count = ?, current_revenue = ?,
            current_software = ?, pain_points = ?, budget = ?, timeline = ?,
            decision_maker = ?, source = ?, status = ?, score = ?, assigned_to = ?,
            tags = ?, last_contact_date = ?, next_follow_up = ?, estimated_value = ?,
            notes = ?, updated_at = ?
          WHERE id = ?
        `;
        
        const params = [
          this.name, this.email, this.company, this.phone, this.website,
          this.industry, this.companySize, this.vehicleCount, this.currentRevenue,
          this.currentSoftware, this.painPoints, this.budget, this.timeline,
          this.decisionMaker, this.source, this.status, this.score, this.assignedTo,
          JSON.stringify(this.tags), this.lastContactDate, this.nextFollowUp, 
          this.estimatedValue, this.notes, this.updatedAt, this.id
        ];

        await query(sql, params);
      } else {
        // Insert new record
        const sql = `
          INSERT INTO leads (
            lead_id, session_id, demo_request_id, name, email, company, phone, website,
            industry, company_size, vehicle_count, current_revenue, current_software,
            pain_points, budget, timeline, decision_maker, source, status, score,
            assigned_to, tags, last_contact_date, next_follow_up, estimated_value,
            notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
          this.leadId, this.sessionId, this.demoRequestId, this.name, this.email,
          this.company, this.phone, this.website, this.industry, this.companySize,
          this.vehicleCount, this.currentRevenue, this.currentSoftware, this.painPoints,
          this.budget, this.timeline, this.decisionMaker, this.source, this.status,
          this.score, this.assignedTo, JSON.stringify(this.tags), this.lastContactDate,
          this.nextFollowUp, this.estimatedValue, this.notes, this.createdAt, this.updatedAt
        ];

        const result = await query(sql, params);
        this.id = result.insertId;
      }
      
      return this;
    } catch (error) {
      console.error('Error saving lead:', error);
      throw error;
    }
  }

  // Find lead by ID
  static async findById(id) {
    try {
      const sql = 'SELECT * FROM leads WHERE id = ?';
      const results = await query(sql, [id]);
      
      if (results.length === 0) {
        return null;
      }

      const lead = new Lead(results[0]);
      if (lead.tags) {
        lead.tags = JSON.parse(lead.tags);
      }
      return lead;
    } catch (error) {
      console.error('Error finding lead by ID:', error);
      throw error;
    }
  }

  // Find lead by email
  static async findByEmail(email) {
    try {
      const sql = 'SELECT * FROM leads WHERE email = ? ORDER BY created_at DESC LIMIT 1';
      const results = await query(sql, [email]);
      
      if (results.length === 0) {
        return null;
      }

      const lead = new Lead(results[0]);
      if (lead.tags) {
        lead.tags = JSON.parse(lead.tags);
      }
      return lead;
    } catch (error) {
      console.error('Error finding lead by email:', error);
      throw error;
    }
  }

  // Get all leads with pagination and filters
  static async findAll(page = 1, limit = 50, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = '1 = 1';
      let params = [];

      // Apply filters
      if (filters.status) {
        whereClause += ' AND status = ?';
        params.push(filters.status);
      }
      if (filters.assignedTo) {
        whereClause += ' AND assigned_to = ?';
        params.push(filters.assignedTo);
      }
      if (filters.minScore) {
        whereClause += ' AND score >= ?';
        params.push(filters.minScore);
      }
      if (filters.source) {
        whereClause += ' AND source = ?';
        params.push(filters.source);
      }
      if (filters.dateFrom) {
        whereClause += ' AND created_at >= ?';
        params.push(filters.dateFrom);
      }
      if (filters.dateTo) {
        whereClause += ' AND created_at <= ?';
        params.push(filters.dateTo);
      }

      const sql = `
        SELECT * FROM leads 
        WHERE ${whereClause}
        ORDER BY score DESC, created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      params.push(limit, offset);
      const results = await query(sql, params);

      // Parse tags for each lead
      const leads = results.map(row => {
        const lead = new Lead(row);
        if (lead.tags) {
          lead.tags = JSON.parse(lead.tags);
        }
        return lead;
      });

      // Get total count
      const countSql = `SELECT COUNT(*) as total FROM leads WHERE ${whereClause}`;
      const countResult = await query(countSql, params.slice(0, -2));
      const total = countResult[0].total;

      return {
        leads,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      console.error('Error finding leads:', error);
      throw error;
    }
  }

  // Update lead score
  async updateScore() {
    let score = 0;

    // Company information completeness (20 points)
    if (this.company) score += 5;
    if (this.website) score += 5;
    if (this.vehicleCount && this.vehicleCount > 0) score += 10;

    // Contact information (15 points)
    if (this.phone) score += 5;
    if (this.email) score += 10;

    // Business details (30 points)
    if (this.currentRevenue) score += 10;
    if (this.budget) score += 10;
    if (this.timeline) score += 10;

    // Decision making power (20 points)
    if (this.decisionMaker === 'yes') score += 20;
    else if (this.decisionMaker === 'influence') score += 10;

    // Pain points and needs (15 points)
    if (this.painPoints && this.painPoints.length > 50) score += 15;

    this.score = Math.min(score, 100);
    return this.score;
  }

  // Add activity/note
  async addActivity(type, description, userId = null) {
    try {
      const sql = `
        INSERT INTO lead_activities (lead_id, type, description, user_id, created_at)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      await query(sql, [this.id, type, description, userId, new Date()]);
      
      // Update last contact date
      this.lastContactDate = new Date();
      await this.save();
    } catch (error) {
      console.error('Error adding lead activity:', error);
      throw error;
    }
  }

  // Get lead activities
  async getActivities() {
    try {
      const sql = `
        SELECT * FROM lead_activities 
        WHERE lead_id = ? 
        ORDER BY created_at DESC
      `;
      
      return await query(sql, [this.id]);
    } catch (error) {
      console.error('Error getting lead activities:', error);
      throw error;
    }
  }

  // Get lead analytics
  static async getAnalytics(dateFrom, dateTo) {
    try {
      const params = [dateFrom, dateTo];
      
      // Total leads
      const totalSql = 'SELECT COUNT(*) as total FROM leads WHERE created_at BETWEEN ? AND ?';
      const totalResult = await query(totalSql, params);

      // Leads by status
      const statusSql = `
        SELECT status, COUNT(*) as count, AVG(score) as avg_score
        FROM leads 
        WHERE created_at BETWEEN ? AND ?
        GROUP BY status
      `;
      const statusResult = await query(statusSql, params);

      // Lead sources
      const sourceSql = `
        SELECT source, COUNT(*) as count
        FROM leads 
        WHERE created_at BETWEEN ? AND ?
        GROUP BY source
      `;
      const sourceResult = await query(sourceSql, params);

      // Conversion funnel
      const funnelSql = `
        SELECT 
          COUNT(*) as total_leads,
          SUM(CASE WHEN status IN ('qualified', 'proposal', 'negotiation', 'closed_won') THEN 1 ELSE 0 END) as qualified,
          SUM(CASE WHEN status IN ('proposal', 'negotiation', 'closed_won') THEN 1 ELSE 0 END) as proposal,
          SUM(CASE WHEN status = 'closed_won' THEN 1 ELSE 0 END) as closed_won,
          SUM(estimated_value) as total_pipeline_value,
          SUM(CASE WHEN status = 'closed_won' THEN estimated_value ELSE 0 END) as closed_value
        FROM leads 
        WHERE created_at BETWEEN ? AND ?
      `;
      const funnelResult = await query(funnelSql, params);

      return {
        totalLeads: totalResult[0].total,
        byStatus: statusResult,
        bySource: sourceResult,
        funnel: funnelResult[0]
      };
    } catch (error) {
      console.error('Error getting lead analytics:', error);
      throw error;
    }
  }
}

module.exports = Lead;
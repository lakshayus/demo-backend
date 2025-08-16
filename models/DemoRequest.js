const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class DemoRequest {
  constructor(data) {
    this.id = data.id || null;
    this.requestId = data.requestId || uuidv4();
    this.sessionId = data.sessionId || null;
    this.type = data.type || 'general'; // 'general', 'module', 'full', 'pricing'
    this.moduleId = data.moduleId || null;
    this.name = data.name || null;
    this.email = data.email || null;
    this.company = data.company || null;
    this.phone = data.phone || null;
    this.vehicleCount = data.vehicleCount || null;
    this.currentChallenges = data.currentChallenges || null;
    this.timeline = data.timeline || null;
    this.preferredContact = data.preferredContact || 'email';
    this.bestTime = data.bestTime || null;
    this.message = data.message || null;
    this.ipAddress = data.ipAddress || null;
    this.userAgent = data.userAgent || null;
    this.referrer = data.referrer || null;
    this.status = data.status || 'new'; // 'new', 'contacted', 'qualified', 'demo_scheduled', 'closed'
    this.priority = data.priority || 'medium'; // 'low', 'medium', 'high'
    this.assignedTo = data.assignedTo || null;
    this.followUpDate = data.followUpDate || null;
    this.notes = data.notes || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Save demo request to database
  async save() {
    try {
      if (this.id) {
        // Update existing record
        const sql = `
          UPDATE demo_requests SET
            name = ?, email = ?, company = ?, phone = ?, 
            vehicle_count = ?, current_challenges = ?, timeline = ?,
            preferred_contact = ?, best_time = ?, message = ?,
            status = ?, priority = ?, assigned_to = ?, follow_up_date = ?,
            notes = ?, updated_at = ?
          WHERE id = ?
        `;
        
        const params = [
          this.name, this.email, this.company, this.phone,
          this.vehicleCount, this.currentChallenges, this.timeline,
          this.preferredContact, this.bestTime, this.message,
          this.status, this.priority, this.assignedTo, this.followUpDate,
          this.notes, this.updatedAt, this.id
        ];

        await query(sql, params);
      } else {
        // Insert new record
        const sql = `
          INSERT INTO demo_requests (
            request_id, session_id, type, module_id, name, email, company, phone,
            vehicle_count, current_challenges, timeline, preferred_contact, 
            best_time, message, ip_address, user_agent, referrer,
            status, priority, assigned_to, follow_up_date, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
          this.requestId, this.sessionId, this.type, this.moduleId,
          this.name, this.email, this.company, this.phone,
          this.vehicleCount, this.currentChallenges, this.timeline,
          this.preferredContact, this.bestTime, this.message,
          this.ipAddress, this.userAgent, this.referrer,
          this.status, this.priority, this.assignedTo, this.followUpDate,
          this.notes, this.createdAt, this.updatedAt
        ];

        const result = await query(sql, params);
        this.id = result.insertId;
      }
      
      return this;
    } catch (error) {
      console.error('Error saving demo request:', error);
      throw error;
    }
  }

  // Find demo request by ID
  static async findById(id) {
    try {
      const sql = 'SELECT * FROM demo_requests WHERE id = ?';
      const results = await query(sql, [id]);
      
      if (results.length === 0) {
        return null;
      }

      return new DemoRequest(results[0]);
    } catch (error) {
      console.error('Error finding demo request by ID:', error);
      throw error;
    }
  }

  // Find demo request by request ID
  static async findByRequestId(requestId) {
    try {
      const sql = 'SELECT * FROM demo_requests WHERE request_id = ?';
      const results = await query(sql, [requestId]);
      
      if (results.length === 0) {
        return null;
      }

      return new DemoRequest(results[0]);
    } catch (error) {
      console.error('Error finding demo request by request ID:', error);
      throw error;
    }
  }

  // Get all demo requests with pagination and filters
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
      if (filters.type) {
        whereClause += ' AND type = ?';
        params.push(filters.type);
      }
      if (filters.priority) {
        whereClause += ' AND priority = ?';
        params.push(filters.priority);
      }
      if (filters.assignedTo) {
        whereClause += ' AND assigned_to = ?';
        params.push(filters.assignedTo);
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
        SELECT * FROM demo_requests 
        WHERE ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      params.push(limit, offset);
      const results = await query(sql, params);

      // Get total count
      const countSql = `SELECT COUNT(*) as total FROM demo_requests WHERE ${whereClause}`;
      const countResult = await query(countSql, params.slice(0, -2));
      const total = countResult[0].total;

      return {
        requests: results.map(row => new DemoRequest(row)),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      console.error('Error finding demo requests:', error);
      throw error;
    }
  }

  // Update status
  async updateStatus(status, notes = null, assignedTo = null) {
    try {
      this.status = status;
      this.notes = notes || this.notes;
      this.assignedTo = assignedTo || this.assignedTo;
      this.updatedAt = new Date();

      const sql = `
        UPDATE demo_requests 
        SET status = ?, notes = ?, assigned_to = ?, updated_at = ?
        WHERE id = ?
      `;
      
      await query(sql, [this.status, this.notes, this.assignedTo, this.updatedAt, this.id]);
      return this;
    } catch (error) {
      console.error('Error updating demo request status:', error);
      throw error;
    }
  }

  // Get analytics for demo requests
  static async getAnalytics(dateFrom, dateTo) {
    try {
      const params = [dateFrom, dateTo];
      
      // Total requests
      const totalSql = 'SELECT COUNT(*) as total FROM demo_requests WHERE created_at BETWEEN ? AND ?';
      const totalResult = await query(totalSql, params);

      // Requests by status
      const statusSql = `
        SELECT status, COUNT(*) as count
        FROM demo_requests 
        WHERE created_at BETWEEN ? AND ?
        GROUP BY status
      `;
      const statusResult = await query(statusSql, params);

      // Requests by type
      const typeSql = `
        SELECT type, COUNT(*) as count
        FROM demo_requests 
        WHERE created_at BETWEEN ? AND ?
        GROUP BY type
      `;
      const typeResult = await query(typeSql, params);

      // Daily requests
      const dailySql = `
        SELECT 
          DATE(created_at) as date, 
          COUNT(*) as count
        FROM demo_requests 
        WHERE created_at BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;
      const dailyResult = await query(dailySql, params);

      return {
        totalRequests: totalResult[0].total,
        byStatus: statusResult,
        byType: typeResult,
        dailyRequests: dailyResult
      };
    } catch (error) {
      console.error('Error getting demo request analytics:', error);
      throw error;
    }
  }
}

module.exports = DemoRequest;
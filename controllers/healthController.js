const { query } = require('../config/database');
const packageJson = require('../package.json');

class HealthController {
  // Basic health check
  async healthCheck(req, res) {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Framtt Backend API',
      version: packageJson.version
    });
  }

  // Detailed health check with database and dependencies
  async detailedHealthCheck(req, res) {
    const healthStatus = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Framtt Backend API',
      version: packageJson.version,
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {}
    };

    // Database health check
    try {
      const dbStart = Date.now();
      await query('SELECT 1 as test');
      const dbTime = Date.now() - dbStart;
      
      healthStatus.checks.database = {
        status: 'healthy',
        responseTime: `${dbTime}ms`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      healthStatus.success = false;
      healthStatus.status = 'unhealthy';
      healthStatus.checks.database = {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }

    // Email service health check
    try {
      const emailService = require('../services/emailService');
      if (emailService.transporter) {
        await emailService.transporter.verify();
        healthStatus.checks.email = {
          status: 'healthy',
          timestamp: new Date().toISOString()
        };
      } else {
        healthStatus.checks.email = {
          status: 'unavailable',
          message: 'Email service not configured',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      healthStatus.checks.email = {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }

    // Environment variables check
    const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    healthStatus.checks.environment = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'warning',
      missingVariables: missingEnvVars,
      timestamp: new Date().toISOString()
    };

    if (missingEnvVars.length > 0) {
      healthStatus.status = 'degraded';
    }

    const statusCode = healthStatus.success ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  }
}

module.exports = new HealthController();
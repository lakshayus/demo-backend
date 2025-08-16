// middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * Strict authentication middleware
 * - Supports API key (x-api-key)
 * - Supports JWT (Authorization: Bearer <token>)
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  try {
    // 🔑 API key auth
    if (apiKey) {
      if (apiKey === process.env.API_KEY) {
        req.user = { role: 'admin', type: 'api_key' };
        return next();
      }
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid API key',
      });
    }

    // 🔑 JWT auth
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]; // safer split
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return next();
      } catch (err) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        });
      }
    }

    // ❌ No credentials
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'No authentication token provided',
    });
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: 'Authentication failed',
    });
  }
}

/**
 * Optional authentication middleware
 * - If credentials valid → sets req.user
 * - If invalid/no credentials → req.user = null, continues request
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  try {
    // API key
    if (apiKey && apiKey === process.env.API_KEY) {
      req.user = { role: 'admin', type: 'api_key' };
    }
    // JWT
    else if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        req.user = null; // invalid token but allow request
      }
    } else {
      req.user = null; // no auth
    }

    return next();
  } catch (err) {
    console.error('OptionalAuth error:', err);
    req.user = null;
    return next();
  }
}

/**
 * Generate JWT
 */
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * Verify JWT (utility function, not middleware)
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null; // safer than throwing, caller decides
  }
}

module.exports = {
  authenticate,
  optionalAuth,
  generateToken,
  verifyToken,
};

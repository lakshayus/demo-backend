// middleware/errorHandler.js

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, isOperational = true, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
const errorHandler = (error, req, res, next) => {
  let err = { ...error, message: error.message };

  // Log error
  console.error(`Error ${error.statusCode || 500}: ${error.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }

  // Handle specific DB / JWT errors
  if (error.code === 'ER_DUP_ENTRY') {
    err = new AppError('Duplicate entry found', 400);
  } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    err = new AppError('Referenced record not found', 400);
  } else if (error.name === 'JsonWebTokenError') {
    err = new AppError('Invalid token', 401);
  } else if (error.name === 'TokenExpiredError') {
    err = new AppError('Token has expired', 401);
  } else if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(val => val.message);
    err = new AppError(`Invalid input data. ${errors.join('. ')}`, 400);
  }

  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    error: err.status || 'error',
    message: err.message || 'Internal server error',
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  if (err.isOperational && err.details) {
    response.details = err.details;
  }

  res.status(statusCode).json(response);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Not found error handler
const notFound = (req, res, next) => {
  next(new AppError(`Not found - ${req.originalUrl}`, 404));
};

module.exports = {
  AppError,
  errorHandler,   // middleware function
  asyncHandler,   // wrapper
  notFound        // 404 handler
};

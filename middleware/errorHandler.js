// Custom error class
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
function errorHandler(error, req, res, next) {
  let err = { ...error };
  err.message = error.message;

  // Log error
  console.error(`Error ${error.statusCode || 500}: ${error.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }

  // MySQL duplicate entry error
  if (error.code === 'ER_DUP_ENTRY') {
    const message = 'Duplicate entry found';
    err = new AppError(message, 400);
  }

  // MySQL foreign key constraint error
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    const message = 'Referenced record not found';
    err = new AppError(message, 400);
  }

  // JSON Web Token error
  if (error.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    err = new AppError(message, 401);
  }

  // JWT expired error
  if (error.name === 'TokenExpiredError') {
    const message = 'Token has expired';
    err = new AppError(message, 401);
  }

  // Validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(val => val.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    err = new AppError(message, 400);
  }

  // Send error response
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    error: err.status || 'error',
    message: err.message || 'Internal server error',
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  // Add error details for operational errors
  if (err.isOperational) {
    response.details = err.details;
  }

  res.status(statusCode).json(response);
}

// Async error wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Not found error handler
function notFound(req, res, next) {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
}

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFound
};
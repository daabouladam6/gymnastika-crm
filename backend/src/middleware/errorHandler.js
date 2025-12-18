/**
 * Error handling middleware for Express
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // Default error
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;


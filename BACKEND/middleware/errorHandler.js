const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const resolvedStatus = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  if (process.env.NODE_ENV !== 'test') {
    console.error('API Error:', {
      path: req.originalUrl,
      method: req.method,
      message: err.message
    });
  }

  res.status(resolvedStatus).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  notFound,
  errorHandler
};

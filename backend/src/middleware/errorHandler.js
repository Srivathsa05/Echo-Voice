export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details
    });
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: `File size exceeds the limit of ${process.env.MAX_FILE_SIZE / 1024 / 1024}MB`
      });
    }
    return res.status(400).json({
      error: 'File upload error',
      message: err.message
    });
  }

  if (err.code === 'ENOENT') {
    return res.status(404).json({
      error: 'File not found',
      message: 'The requested file does not exist'
    });
  }

  if (err.status) {
    return res.status(err.status).json({
      error: err.message || 'An error occurred'
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

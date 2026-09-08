import logger from '../config/logger.js';
import { errorResponse } from '../utils/responseHandler.js';

const errorHandler = (err, req, res, next) => {
  logger.error(`Error occurred on ${req.method} ${req.url}: ${err.message}`, {
    stack: err.stack
  });

  // 1. Multer file size limit exceeded
  if (err.code === 'LIMIT_FILE_SIZE') {
    return errorResponse(res, 400, 'File size too large. Maximum allowed size is 10MB.');
  }

  // 2. Custom file filter rejection
  if (err.message && err.message.includes('Invalid file type')) {
    return errorResponse(res, 400, err.message);
  }

  // 3. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errorMessages = Object.values(err.errors).map((item) => item.message);
    return errorResponse(res, 400, 'Validation Error', errorMessages);
  }

  // 4. Mongoose Duplicate Key Error (e.g. duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return errorResponse(res, 409, `An account with this ${field} already exists.`);
  }

  // 5. JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Invalid authentication token.');
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Authentication token has expired.');
  }

  // Default Fallback Server Error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return errorResponse(res, statusCode, message);
};

export default errorHandler;
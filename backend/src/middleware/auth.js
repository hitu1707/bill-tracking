import { errorResponse } from '../utils/responseHandler.js';

export const authenticate = (req, res, next) => {
  // Passport session attaches isAuthenticated() to the request
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return errorResponse(res, 401, 'Unauthorized. Please login to continue.');
};
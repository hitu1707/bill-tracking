import morgan from 'morgan';
import logger from '../config/logger.js';

// Custom format for HTTP request logging
const morganFormat = ':method :url :status :res[content-length] - :response-time ms';

const morganMiddleware = morgan(morganFormat, {
  stream: {
    write: (message) => {
      logger.info(`HTTP ${message.trim()}`);
    }
  }
});

export default morganMiddleware;
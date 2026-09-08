import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import session from 'express-session';
import MongoStore from 'connect-mongo';

// Configurations & Database
import connectDB from './src/config/db.js';
import passport from './src/config/passport.js';
import logger from './src/config/logger.js';

// Middleware
import morganMiddleware from './src/middleware/requestLogger.js';
import errorHandler from './src/middleware/errorHandler.js';
import { errorResponse, successResponse } from './src/utils/responseHandler.js';

// Route Modules
import authRoutes from './src/modules/auth/auth.routes.js';
import billRoutes from './src/modules/bill/bill.routes.js';
import userRoutes from './src/modules/user/user.routes.js';

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// ─── 1. TRUST PROXY (REQUIRED FOR HTTPS ON RENDER) ───
if (isProduction) {
  app.set('trust proxy', 1);
}

// ─── 2. CORS CONFIGURATION ───
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile native apps or Postman) or matched origins
    if (!origin || allowedOrigins.includes(origin) || !isProduction) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive during initial deployment
    }
  },
  credentials: true // 👈 Allows cookies across domains
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morganMiddleware);

// Static uploads folder
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── 3. PRODUCTION-SAFE SESSION COOKIES ───
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret_key_session_123',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/billTracker',
      ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: {
      maxAge: 14 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: isProduction, // 👈 Must be true in production (HTTPS)
      sameSite: isProduction ? 'none' : 'lax' // 👈 'none' allows cookies between Vercel & Render
    }
  })
);

// ─── 4. PASSPORT SESSION ───
app.use(passport.initialize());
app.use(passport.session());

// ─── 5. HEALTH CHECK ───
app.get('/api/health', (req, res) => {
  return successResponse(res, 200, 'Bill Tracker API is live 🚀', {
    environment: process.env.NODE_ENV || 'development',
    user: req.user ? req.user.email : 'Guest'
  });
});

// ─── 6. ROUTES ───
app.use('/api/auth', authRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/users', userRoutes);

// ─── 7. 404 & ERROR HANDLING ───
app.use((req, res) => {
  return errorResponse(res, 404, `Route ${req.method} ${req.originalUrl} not found`);
});
app.use(errorHandler);

// ─── 8. START SERVER (PORT FROM RENDER) ───
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`🌱 Mode: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error(`Startup failure: ${error.message}`);
    process.exit(1);
  }
};

startServer();
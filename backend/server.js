import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import willsRoutes from './routes/wills.js';
import assetsRoutes from './routes/assets.js';
import recipientsRoutes from './routes/recipients.js';
import notificationsRoutes from './routes/notifications.js';
import pushNotificationsRoutes from './routes/pushNotifications.js';
import uploadRoutes from './routes/upload.js';
import profilesRoutes from './routes/profiles.js';
import emailVerificationRoutes from './routes/emailVerification.js';
import testEmailRoutes from './routes/testEmail.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import translateRoutes from './routes/translate.js';
import pool from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
const allowedOrigins = String(process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('CORS origin denied'));
    },
    credentials: true,
  }),
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(cookieParser());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 300),
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve locally stored uploads (dev fallback when R2 isn't configured)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    status: 'ok', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth (includes POST /api/auth/delete-account for account removal)',
      users: '/api/users',
      wills: '/api/wills',
      assets: '/api/assets',
      recipients: '/api/recipients',
      upload: '/api/upload',
      notifications: '/api/notifications',
      profiles: '/api/profiles',
      push: '/api/push-notifications'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'ok', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      success: true, 
      message: 'Database connection successful',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Middleware to normalize URLs (remove double slashes)
app.use((req, res, next) => {
  // Normalize the URL by removing double slashes (except after protocol)
  // Note: req.path is read-only, so we only modify req.url
  req.url = req.url.replace(/([^:]\/)\/+/g, '$1');
  next();
});

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/wills', willsRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/recipients', recipientsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/push-notifications', pushNotificationsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/email-verification', emailVerificationRoutes);
app.use('/api/test-email', testEmailRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/translate', translateRoutes);

// Error handling middleware (must be before 404 handler)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Request path:', req.path);
  console.error('Request method:', req.method);
  res.status(err.status || 500).json({
    success: false,
    message: err.status === 401 || err.status === 403 ? err.message : 'Internal server error',
  });
});

// 404 handler (must be last)
app.use((req, res) => {
  console.warn(`⚠️ Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    availableRoutes: [
      'POST /api/upload/audio',
      'POST /api/upload/video',
      'GET /api/upload/status',
      'POST /api/wills/save',
      'POST /api/assets/add',
      'POST /api/recipients/add'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoints:`);
  console.log(`   POST /api/auth/register - Register new user`);
  console.log(`   POST /api/auth/login - Login user`);
  console.log(`   GET /api/users - Get all users`);
  console.log(`   GET /api/users/:id - Get user by ID`);
  console.log(`   POST /api/wills/save - Save/update will`);
  console.log(`   GET /api/wills/user/:userId - Get user's will`);
  console.log(`   POST /api/wills/finalize - Finalize will`);
  console.log(`   POST /api/assets/add - Add asset`);
  console.log(`   GET /api/assets/user/:userId - Get user's assets`);
  console.log(`   POST /api/recipients/add - Add recipient`);
  console.log(`   GET /api/recipients/user/:userId - Get user's recipients`);
      console.log(`   POST /api/upload/audio - Upload audio recording to R2`);
      console.log(`   POST /api/upload/video - Upload video recording to R2`);
      console.log(`   GET /api/upload/status - Check R2 configuration status`);
      console.log(`   POST /api/chat/message - Save single chat message`);
      console.log(`   POST /api/chat/messages - Save multiple chat messages`);
      console.log(`   GET /api/chat/messages - Get chat messages`);
      console.log(`   POST /api/chat/upload-audio - Upload audio for chat`);
      console.log(`   POST /api/chat/upload-video - Upload video for chat`);
  console.log(`   POST /api/notifications/send-will-notifications - Send email notifications`);
      console.log(`   POST /api/profiles/update - Update user profile`);
      console.log(`   POST /api/email-verification/send-verification - Send verification email`);
      console.log(`   GET /api/email-verification/verify?token=xxx - Verify email token`);
      console.log(`   GET /api/email-verification/status/:userId - Check verification status`);
      console.log(`   POST /api/test-email/test - Test email sending`);
      console.log(`   GET /health - Health check`);
      console.log(`   GET /api/test-db - Test database connection`);
});

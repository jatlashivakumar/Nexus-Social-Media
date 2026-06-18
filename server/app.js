import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import 'dotenv/config';

import passport from './config/passport.js';

import authRoutes         from './routes/authRoutes.js';
import userRoutes         from './routes/userRoutes.js';
import postRoutes         from './routes/postRoutes.js';
import chatRoutes         from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import paymentRoutes      from './routes/paymentRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import logger from './utils/logger.js';

const app = express();

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// ── Razorpay webhook needs the RAW request body to verify HMAC signature.
// This MUST be registered before express.json(), and only for this path.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(compression());

// ── Session is required by passport during the OAuth handshake only.
// We don't use sessions for actual app auth — that's all JWT (see authMiddleware).
app.use(session({
  secret: process.env.SESSION_SECRET || 'nexus_oauth_temp_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 10 * 60 * 1000 }, // 10 min, just for the OAuth redirect flow
}));
app.use(passport.initialize());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: (m) => logger.http(m.trim()) } }));
}

const limiter = rateLimit({
  windowMs: +process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: +process.env.RATE_LIMIT_MAX || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, 
  // max: 10,
  max: 1000,
  message: { success: false, message: 'Too many auth attempts.' } });

app.use('/api', limiter);
app.get('/api/health', (_, res) =>
  res.json({ success: true, message: 'OK', env: process.env.NODE_ENV }));

app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/posts',         postRoutes);
app.use('/api/chat',          chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments',      paymentRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import uploadRoutes from './routes/upload.js';
import recordRoutes from './routes/record.js';
import processRoutes from './routes/process.js';
import resultsRoutes from './routes/results.js';
import chatRoutes from './routes/chat.js';
import exportRoutes from './routes/export.js';
import historyRoutes from './routes/history.js';
import smsRoutes from './routes/sms.js';
import healthRoutes from './routes/health.js';

import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { cleanupOldFiles } from './utils/fileCleanup.js';

dotenv.config();

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep server running
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Handle server errors
httpServer.on('error', (error) => {
  if (error.code === 'ECONNRESET') {
    logger.warn('Connection reset by client - this is normal for large uploads');
  } else {
    logger.error('Server error:', error);
  }
});

const PORT = process.env.PORT || 3001;

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/upload', uploadRoutes);
app.use('/api/record', recordRoutes);
app.use('/api/process', processRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/health', healthRoutes);

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join-session', (sessionId) => {
    socket.join(sessionId);
    logger.info(`Socket ${socket.id} joined session: ${sessionId}`);
  });

  socket.on('leave-session', (sessionId) => {
    socket.leave(sessionId);
    logger.info(`Socket ${socket.id} left session: ${sessionId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });

  // Handle socket errors
  socket.on('error', (error) => {
    logger.error(`Socket error for ${socket.id}:`, error);
  });
});

app.use(errorHandler);

httpServer.listen(PORT, () => {
  logger.info(`Echo Backend Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  
  cleanupOldFiles();
  setInterval(cleanupOldFiles, 60 * 60 * 1000);
});

export { io };

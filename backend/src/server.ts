import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import predictionRoutes from './routes/predictions.js';
import teamRoutes from './routes/teams.js';
import matchRoutes from './routes/matches.js';
import bonusRoutes from './routes/bonusQuestions.js';
import adminRoutes from './routes/admin.js';
import phaseRoutes from './routes/phases.js';

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '❌' : '✓';
    console.log(`${statusColor} [${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/bonus-questions', bonusRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/phases', phaseRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`\n✓ Server running on http://localhost:${env.PORT}`);
      console.log(`✓ Environment: ${env.NODE_ENV}`);
      console.log(`✓ Frontend URL: ${env.FRONTEND_URL}`);
      console.log(`✓ Database: ${env.DATABASE_URL.split('@')[1]}\n`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n✓ Shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n✓ Shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

startServer();

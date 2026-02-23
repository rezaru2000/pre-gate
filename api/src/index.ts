import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import logger from './utils/logger';
import { connectDb } from './db/pool';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import surveyRouter from './routes/survey';
import adminRouter from './routes/admin';

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Request logging + correlation ID
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter);

// Routes
app.use('/health', healthRouter);
app.use('/api/survey', surveyRouter);
app.use('/api/admin', adminRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Centralised error handler
app.use(errorHandler);

async function start() {
  try {
    await connectDb();
    app.listen(config.port, () => {
      logger.info(`pregate-api started`, { port: config.port, environment: config.nodeEnv });
    });
  } catch (err) {
    logger.error('failed to start server', { message: (err as Error).message, stack: (err as Error).stack });
    process.exit(1);
  }
}

start();

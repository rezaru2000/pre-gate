import rateLimit from 'express-rate-limit';
import { config } from '../config/env';
import logger from '../utils/logger';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    logger.warn('rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      correlationId: res.locals['correlationId'],
    });
    res.status(options.statusCode).json({
      error: 'Too many requests. Please try again later.',
    });
  },
});

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.headers['x-correlation-id'] as string) ?? uuidv4();
  res.locals['correlationId'] = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);

  const start = Date.now();

  res.on('finish', () => {
    logger.info('request completed', {
      correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      durationMs: Date.now() - start,
    });
  });

  next();
}

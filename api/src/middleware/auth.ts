import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import logger from '../utils/logger';

export interface AdminPayload {
  adminId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Locals {
      correlationId: string;
      admin?: AdminPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.['pregate_token'] as string | undefined;

  if (!token) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as AdminPayload;
    res.locals['admin'] = payload;
    next();
  } catch (err) {
    logger.warn('invalid jwt token', {
      correlationId: res.locals['correlationId'],
      ip: req.ip,
      error: err instanceof Error ? err.message : 'unknown',
    });
    res.status(401).json({ error: 'Unauthorised' });
  }
}

import { Router } from 'express';
import { config } from '../config/env';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;

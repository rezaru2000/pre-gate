import { Pool } from 'pg';
import { config } from '../config/env';
import logger from '../utils/logger';

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('pg pool error', { message: err.message, stack: err.stack });
});

export async function connectDb(): Promise<void> {
  const client = await pool.connect();
  client.release();
  logger.info('database connection established');
}

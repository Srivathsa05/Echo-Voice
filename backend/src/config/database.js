import pg from 'pg';
const { Pool } = pg;
import { logger } from '../utils/logger.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('Unexpected database error:', err);
  process.exit(-1);
});

export const query = (text, params) => {
  const start = Date.now();
  return pool.query(text, params)
    .then(res => {
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: res.rowCount });
      return res;
    })
    .catch(err => {
      logger.error('Database query error:', err);
      throw err;
    });
};

export const getClient = () => {
  return pool.connect();
};

export default pool;

import express from 'express';
import { config } from '../config/index.js';
import { cache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      version: '1.0.0',
      services: {
        api: 'operational',
        cache: {
          status: 'operational',
          size: cache.size(),
          keys: cache.keys().length
        }
      },
      dependencies: {
        openai: config.openai.apiKey ? 'configured' : 'not configured'
      }
    };

    res.json(healthCheck);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

router.get('/ready', async (req, res) => {
  const isReady = config.openai.apiKey !== undefined;

  if (isReady) {
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      reason: 'OpenAI API key not configured'
    });
  }
});

export default router;

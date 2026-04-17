import express from 'express';
import { sessionStore } from '../utils/sessionStore.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.get('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await sessionStore.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'No session found with the provided ID'
      });
    }

    res.json({
      sessionId: session.id,
      status: session.status.toJSON(),
      doctorName: session.doctorName,
      patientName: session.patientName,
      createdAt: session.createdAt
    });
  } catch (error) {
    logger.error('Get process status error:', error);
    next(error);
  }
});

export default router;

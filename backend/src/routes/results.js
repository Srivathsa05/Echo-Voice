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

    if (!session.status.completed) {
      return res.status(200).json({
        sessionId: session.id,
        status: session.status.toJSON(),
        message: 'Processing not yet completed'
      });
    }

    const results = {
      sessionId: session.id,
      doctorName: session.doctorName,
      patientName: session.patientName,
      createdAt: session.createdAt,
      audioDuration: session.audioFile?.duration || null,
      summary: session.summary?.toJSON() || null,
      questions: session.questions?.toJSON() || null,
      transcript: session.transcript?.toJSON() || null,
      status: session.status.toJSON()
    };

    res.json(results);
  } catch (error) {
    logger.error('Get results error:', error);
    next(error);
  }
});

export default router;

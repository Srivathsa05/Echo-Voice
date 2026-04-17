import express from 'express';
import { sessionStore } from '../utils/sessionStore.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { search, tag } = req.query;

    let sessions = await sessionStore.getAllSessions();

    if (search) {
      sessions = await sessionStore.searchSessions(search);
    }

    if (tag) {
      sessions = await sessionStore.filterSessionsByTag(tag);
    }

    const history = sessions
      .filter(session => session.status.completed)
      .map(session => ({
        id: session.id,
        title: session.metadata?.title || `${session.doctorName} consultation`,
        doctorName: session.doctorName,
        patientName: session.patientName,
        date: session.createdAt,
        duration: session.audioFile?.duration || null,
        tags: session.metadata?.tags || [],
        urgent: session.summary?.warnings?.length > 0
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      total: history.length,
      consultations: history
    });
  } catch (error) {
    logger.error('Get history error:', error);
    next(error);
  }
});

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

    const summary = {
      id: session.id,
      title: session.metadata?.title || `${session.doctorName} consultation`,
      doctorName: session.doctorName,
      patientName: session.patientName,
      createdAt: session.createdAt,
      audioDuration: session.audioFile?.duration || null,
      tags: session.metadata?.tags || [],
      urgent: session.summary?.warnings?.length > 0,
      diagnosis: session.summary?.diagnosis || [],
      medications: session.summary?.medications || [],
      warnings: session.summary?.warnings || []
    };

    res.json(summary);
  } catch (error) {
    logger.error('Get session summary error:', error);
    next(error);
  }
});

export default router;

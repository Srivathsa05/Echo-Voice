import express from 'express';
import { sessionStore } from '../utils/sessionStore.js';
import { consultationModel } from '../models/consultationModel.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { search, tag } = req.query;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    let consultations = [];

    // Try to fetch from database first
    if (process.env.DATABASE_URL) {
      try {
        consultations = await consultationModel.getAllConsultations(limit, offset, search);
        
        // Format for frontend
        const history = consultations.map(consultation => ({
          id: consultation.session_id,
          sessionId: consultation.session_id,
          title: `${consultation.doctor_name} consultation`,
          doctorName: consultation.doctor_name,
          patientName: consultation.patient_name,
          specialty: consultation.specialty || 'General Practice',
          date: consultation.created_at,
          duration: consultation.audio_duration || null,
          tags: [],
          urgent: false
        }));

        return res.json({
          total: history.length,
          consultations: history
        });
      } catch (dbError) {
        logger.error('Database fetch error, falling back to session store:', dbError);
      }
    }

    // Fallback to in-memory session store
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
        sessionId: session.id,
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

    // Try to fetch from database first
    if (process.env.DATABASE_URL) {
      try {
        const consultation = await consultationModel.getFullConsultation(sessionId);
        
        if (consultation) {
          const summary = {
            id: consultation.session_id,
            sessionId: consultation.session_id,
            title: `${consultation.doctor_name} consultation`,
            doctorName: consultation.doctor_name,
            patientName: consultation.patient_name,
            createdAt: consultation.created_at,
            audioDuration: consultation.audio_duration || null,
            tags: [],
            urgent: false,
            diagnosis: consultation.summary?.diagnosis || [],
            medications: consultation.summary?.medications || [],
            warnings: consultation.summary?.warnings || []
          };

          return res.json(summary);
        }
      } catch (dbError) {
        logger.error('Database fetch error, falling back to session store:', dbError);
      }
    }

    // Fallback to in-memory session store
    const session = await sessionStore.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'No session found with the provided ID'
      });
    }

    const summary = {
      id: session.id,
      sessionId: session.id,
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

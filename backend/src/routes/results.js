import express from 'express';
import { sessionStore } from '../utils/sessionStore.js';
import { consultationModel } from '../models/consultationModel.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.get('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Try to fetch from database first
    if (process.env.DATABASE_URL) {
      try {
        const consultation = await consultationModel.getFullConsultation(sessionId);
        
        if (consultation) {
          const results = {
            sessionId: consultation.session_id,
            doctorName: consultation.doctor_name,
            patientName: consultation.patient_name,
            createdAt: consultation.created_at,
            audioDuration: consultation.audio_duration || null,
            summary: consultation.summary ? {
              diagnosis: consultation.summary.diagnosis || [],
              medications: consultation.summary.medications || [],
              nextSteps: consultation.summary.next_steps || [],
              warnings: consultation.summary.warnings || [],
              importantNotes: consultation.summary.important_notes || [],
              vitals: consultation.summary.vitals || [],
              lifestyle: consultation.summary.lifestyle || [],
              labs: consultation.summary.labs || []
            } : null,
            questions: consultation.questions ? {
              questions: consultation.questions.questions || [],
              answers: consultation.questions.answers || []
            } : null,
            transcript: consultation.transcript ? {
              segments: consultation.transcript.segments || [],
              cleanedText: consultation.transcript.cleaned_text || ''
            } : null,
            status: { currentStage: 'done', progress: 100, completed: true, error: null }
          };

          return res.json(results);
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

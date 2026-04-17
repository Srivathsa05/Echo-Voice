import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

export const consultationModel = {
  async createConsultation(data) {
    try {
      const { sessionId, doctorName, patientName, audioFileName, audioDuration, specialty } = data;
      const result = await query(
        `INSERT INTO consultations (session_id, doctor_name, patient_name, audio_file_name, audio_duration, specialty)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [sessionId, doctorName, patientName, audioFileName, audioDuration, specialty || 'General Practice']
      );
      logger.info(`Consultation created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating consultation:', error);
      throw error;
    }
  },

  async getConsultationBySessionId(sessionId) {
    try {
      const result = await query(
        'SELECT * FROM consultations WHERE session_id = $1',
        [sessionId]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching consultation:', error);
      throw error;
    }
  },

  async getAllConsultations(limit = 50, offset = 0, search = '') {
    try {
      let queryText = `
        SELECT c.id, c.session_id, c.doctor_name, c.patient_name, 
               c.audio_file_name, c.audio_duration, c.created_at
        FROM consultations c
      `;
      let params = [];
      let paramCount = 1;

      if (search) {
        queryText += ` WHERE c.doctor_name ILIKE $${paramCount} OR c.patient_name ILIKE $${paramCount}`;
        params.push(`%${search}%`);
        paramCount++;
      }

      queryText += ` ORDER BY c.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching consultations:', error);
      throw error;
    }
  },

  async saveTranscript(consultationId, transcriptData) {
    try {
      const { rawText, cleanedText, segments, language, duration } = transcriptData;
      const result = await query(
        `INSERT INTO transcripts (consultation_id, raw_text, cleaned_text, segments, language, duration)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (consultation_id) DO UPDATE
         SET raw_text = $2, cleaned_text = $3, segments = $4, language = $5, duration = $6
         RETURNING *`,
        [consultationId, rawText, cleanedText, JSON.stringify(segments), language, duration]
      );
      logger.info(`Transcript saved for consultation: ${consultationId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error saving transcript:', error);
      throw error;
    }
  },

  async saveSummary(consultationId, summaryData) {
    try {
      const result = await query(
        `INSERT INTO summaries (consultation_id, diagnosis, medications, next_steps, warnings, important_notes, vitals, lifestyle, labs)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (consultation_id) DO UPDATE
         SET diagnosis = $2, medications = $3, next_steps = $4, warnings = $5, important_notes = $6, vitals = $7, lifestyle = $8, labs = $9
         RETURNING *`,
        [consultationId, JSON.stringify(summaryData.diagnosis), JSON.stringify(summaryData.medications), 
         JSON.stringify(summaryData.nextSteps), JSON.stringify(summaryData.warnings), JSON.stringify(summaryData.importantNotes),
         JSON.stringify(summaryData.vitals), JSON.stringify(summaryData.lifestyle), JSON.stringify(summaryData.labs)]
      );
      logger.info(`Summary saved for consultation: ${consultationId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error saving summary:', error);
      throw error;
    }
  },

  async saveQuestions(consultationId, questionsData) {
    try {
      const { questions, answers } = questionsData;
      const result = await query(
        `INSERT INTO questions (consultation_id, questions, answers)
         VALUES ($1, $2, $3)
         ON CONFLICT (consultation_id) DO UPDATE
         SET questions = $2, answers = $3
         RETURNING *`,
        [consultationId, questions, answers]
      );
      logger.info(`Questions saved for consultation: ${consultationId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error saving questions:', error);
      throw error;
    }
  },

  async getFullConsultation(sessionId) {
    try {
      const consultation = await this.getConsultationBySessionId(sessionId);
      if (!consultation) return null;

      const transcriptResult = await query(
        'SELECT * FROM transcripts WHERE consultation_id = $1',
        [consultation.id]
      );

      const summaryResult = await query(
        'SELECT * FROM summaries WHERE consultation_id = $1',
        [consultation.id]
      );

      const questionsResult = await query(
        'SELECT * FROM questions WHERE consultation_id = $1',
        [consultation.id]
      );

      return {
        ...consultation,
        transcript: transcriptResult.rows[0] || null,
        summary: summaryResult.rows[0] || null,
        questions: questionsResult.rows[0] || null
      };
    } catch (error) {
      logger.error('Error fetching full consultation:', error);
      throw error;
    }
  }
};

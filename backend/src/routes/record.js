import express from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { AudioFile } from '../models/AudioFile.js';
import { Session } from '../models/Session.js';
import { sessionStore } from '../utils/sessionStore.js';
import { processingService } from '../services/processingService.js';
import { audioService } from '../services/audioService.js';
import { validateAudioFile } from '../middleware/fileValidation.js';
import { validate } from '../middleware/validation.js';
import { recordSchema } from '../validators/uploadValidator.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.post('/', validateAudioFile, validate(recordSchema), async (req, res, next) => {
  try {
    const { doctorName, patientName, audioData } = req.validatedData;
    const audioBuffer = req.audioBuffer;

    const sessionId = uuidv4();
    const filename = `live-recording-${sessionId}.wav`;

    const filepath = await audioService.saveAudioBuffer(audioBuffer, filename);

    const audio = new AudioFile({
      filename,
      filepath,
      size: audioBuffer.length,
      sessionId,
      mimeType: 'audio/wav'
    });

    const session = await sessionStore.createSession({
      id: sessionId,
      doctorName,
      patientName,
      audioFile: audio
    });

    logger.info(`Live recording saved: ${filename}, Session: ${sessionId}`);

    processingService.processUpload(sessionId, filepath, req.io)
      .then(() => {
        logger.info(`Processing completed for session: ${sessionId}`);
      })
      .catch((error) => {
        logger.error(`Processing failed for session ${sessionId}:`, error);
      });

    res.status(201).json({
      sessionId,
      message: 'Recording saved successfully. Processing started.',
      status: session.status.toJSON()
    });
  } catch (error) {
    logger.error('Recording error:', error);
    next(error);
  }
});

export default router;

import express from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { sessionStore } from '../utils/sessionStore.js';
import { pdfService } from '../services/pdfService.js';
import { validate } from '../middleware/validation.js';
import { exportSchema } from '../validators/uploadValidator.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

const router = express.Router();

router.post('/pdf', validate(exportSchema), async (req, res, next) => {
  try {
    const { sessionId, format } = req.validatedData;

    const session = await sessionStore.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'No session found with the provided ID'
      });
    }

    if (!session.status.completed) {
      return res.status(400).json({
        error: 'Processing not complete',
        message: 'Please wait for the consultation to finish processing'
      });
    }

    const pdfId = uuidv4();
    const filename = `echo-consultation-${sessionId}-${pdfId}.pdf`;
    const outputPath = path.join(config.upload.tempStoragePath, filename);

    await pdfService.generateConsultationPDF(session, outputPath);

    logger.info(`PDF generated: ${filename}`);

    res.download(outputPath, `Echo-Consultation-${session.patientName.replace(/\s+/g, '-')}.pdf`, (err) => {
      if (err) {
        logger.error('PDF download error:', err);
      }
    });
  } catch (error) {
    logger.error('PDF export error:', error);
    next(error);
  }
});

export default router;

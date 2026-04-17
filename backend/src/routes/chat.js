import express from 'express';
import { sessionStore } from '../utils/sessionStore.js';
import { processingService } from '../services/processingService.js';
import { validate } from '../middleware/validation.js';
import { chatSchema } from '../validators/uploadValidator.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.post('/', validate(chatSchema), async (req, res, next) => {
  try {
    const { sessionId, question } = req.validatedData;

    const session = await sessionStore.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'No session found with the provided ID'
      });
    }

    if (!session.transcript) {
      return res.status(400).json({
        error: 'Transcript not available',
        message: 'The consultation has not been processed yet'
      });
    }

    const result = await processingService.processChat(sessionId, question, req.io);

    res.json({
      sessionId,
      chat: result
    });
  } catch (error) {
    logger.error('Chat error:', error);
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

    res.json({
      sessionId,
      chatHistory: session.chatHistory.map(msg => msg.toJSON())
    });
  } catch (error) {
    logger.error('Get chat history error:', error);
    next(error);
  }
});

export default router;

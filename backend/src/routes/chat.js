import express from 'express';
import { sessionStore } from '../utils/sessionStore.js';
import { processingService } from '../services/processingService.js';
import { validate } from '../middleware/validation.js';
import { chatSchema } from '../validators/uploadValidator.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({ apiKey: config.openai.apiKey });

router.post('/', async (req, res, next) => {
  try {
    const { question, sessionId } = req.body;

    logger.info('Chat request received:', { question, sessionId });

    // If sessionId provided, try to fetch consultation from database
    if (sessionId) {
      try {
        logger.info('Fetching consultation from database for sessionId:', sessionId);
        const consultation = await consultationModel.getFullConsultation(sessionId);
        
        logger.info('Consultation fetched:', consultation ? 'Found' : 'Not found');
        
        if (consultation && consultation.transcript) {
          // Use consultation transcript for context
          const transcriptText = consultation.transcript.cleaned_text || consultation.transcript.raw_text;
          const summary = consultation.summary || {};
          
          const systemPrompt = `You are Echo, a helpful medical assistant. You have access to the following consultation transcript and summary. Use this information to answer the patient's questions accurately.

Consultation Summary:
- Doctor: ${consultation.doctor_name}
- Patient: ${consultation.patient_name}
- Date: ${consultation.created_at}
- Specialty: ${consultation.specialty}

Key Findings:
${summary.diagnosis ? '- Diagnosis: ' + JSON.stringify(summary.diagnosis) : ''}
${summary.medications ? '- Medications: ' + JSON.stringify(summary.medications) : ''}
${summary.warnings ? '- Warnings: ' + JSON.stringify(summary.warnings) : ''}

Transcript (last 2000 characters):
${transcriptText.slice(-2000)}

Answer the patient's question based on this consultation. If the information is not available in the consultation, say so and advise them to consult their doctor. Keep answers concise and easy to understand.`;

          const completion = await openai.chat.completions.create({
            model: config.openai.gptModel,
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: question
              }
            ],
            max_tokens: 500,
            temperature: 0.7
          });

          return res.json({
            answer: completion.choices[0].message.content
          });
        }
      } catch (dbError) {
        logger.warn('Could not fetch consultation from database, using fallback:', dbError.message);
      }
    }

    // Fallback: No sessionId or consultation not found - use general medical assistant
    const completion = await openai.chat.completions.create({
      model: config.openai.gptModel,
      messages: [
        {
          role: 'system',
          content: 'You are Echo, a helpful medical assistant. Provide clear, accurate medical information in simple terms. Always advise consulting a doctor for serious concerns.'
        },
        {
          role: 'user',
          content: question
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    res.json({
      answer: completion.choices[0].message.content
    });
  } catch (error) {
    logger.error('Chat error:', error);
    
    // If API key is missing or invalid, return mock response
    if (error.message.includes('API') || error.message.includes('401') || error.message.includes('key')) {
      logger.warn('OpenAI API key issue - returning mock response');
      return res.json({
        answer: "I'm in demo mode without API keys right now. Based on your consultation, I'd suggest discussing this with your doctor. This is a temporary limitation - full AI responses will work once API keys are configured."
      });
    }
    
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

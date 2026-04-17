import OpenAI from 'openai';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

const SUMMARY_PROMPT = `Convert this medical consultation transcript into patient-friendly language. Include:
- Diagnosis in simple terms
- Medications with dosages
- Next steps/timeline
- Important warnings or notes
- Vital signs mentioned
- Lifestyle recommendations
- Lab tests or follow-ups

Keep it under 150 words, no medical jargon. Format as structured JSON with keys:
{
  "diagnosis": [{"title": "diagnosis name", "urgency": "green|amber|red"}],
  "medications": [{"name": "medication name", "dose": "dosage", "frequency": "frequency", "timing": "when to take", "color": "primary|trust|warning"}],
  "nextSteps": [{"title": "next step", "urgency": "green|amber|red"}],
  "warnings": [{"title": "warning", "urgency": "red"}],
  "importantNotes": [{"title": "note", "urgency": "green|amber|red"}],
  "vitals": [{"title": "vital reading", "urgency": "green|amber|red"}],
  "lifestyle": [{"title": "lifestyle recommendation", "urgency": "green"}],
  "labs": [{"title": "lab test or follow-up", "urgency": "green"}]
}`;

const QUESTIONS_PROMPT = `Based on this consultation, generate 5-7 important questions patients typically forget to ask about:
- Side effects of prescribed medications
- Dietary restrictions
- Follow-up appointment timing
- Warning signs to watch for
- Activity restrictions
- Long-term prognosis
- Alternative treatments

Format as JSON array:
{
  "questions": [
    {
      "question": "clear question statement",
      "answer": "helpful answer based on the consultation"
    }
  ]
}`;

export const analysisService = {
  async generateSummary(transcript) {
    const maxRetries = config.openai.maxRetries;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Summary generation attempt ${attempt}/${maxRetries}`);

        const responsePromise = openai.chat.completions.create({
          model: config.openai.gptModel,
          messages: [
            {
              role: 'system',
              content: 'You are a medical consultation assistant specializing in creating patient-friendly summaries. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: `${SUMMARY_PROMPT}\n\nTranscript:\n${transcript}`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        });

        // Add timeout wrapper
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Summary generation timeout')), 120000); // 2 minute timeout
        });

        const response = await Promise.race([responsePromise, timeoutPromise]);

        const content = response.choices[0].message.content;
        const summary = JSON.parse(content);

        logger.info('Summary generated successfully');
        return summary;
      } catch (error) {
        lastError = error;
        
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
          logger.error(`Summary generation attempt ${attempt} failed - Network error:`, error.code);
        } else {
          logger.error(`Summary generation attempt ${attempt} failed:`, error.message);
        }

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          logger.info(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.error('All summary generation attempts failed');
    throw new Error(`Summary generation failed after ${maxRetries} attempts: ${lastError.message}`);
  },

  async generateQuestions(transcript) {
    const maxRetries = config.openai.maxRetries;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Questions generation attempt ${attempt}/${maxRetries}`);

        const responsePromise = openai.chat.completions.create({
          model: config.openai.gptModel,
          messages: [
            {
              role: 'system',
              content: 'You are a medical consultation assistant helping patients remember important questions to ask. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: `${QUESTIONS_PROMPT}\n\nTranscript:\n${transcript}`
            }
          ],
          temperature: 0.5,
          max_tokens: 1500,
          response_format: { type: 'json_object' }
        });

        // Add timeout wrapper
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Questions generation timeout')), 120000); // 2 minute timeout
        });

        const response = await Promise.race([responsePromise, timeoutPromise]);

        const content = response.choices[0].message.content;
        const questions = JSON.parse(content);

        logger.info('Questions generated successfully');
        return questions.questions || [];
      } catch (error) {
        lastError = error;
        
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
          logger.error(`Questions generation attempt ${attempt} failed - Network error:`, error.code);
        } else {
          logger.error(`Questions generation attempt ${attempt} failed:`, error.message);
        }

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          logger.info(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.error('All questions generation attempts failed');
    throw new Error(`Questions generation failed after ${maxRetries} attempts: ${lastError.message}`);
  },

  async answerChatQuestion(transcript, question) {
    const maxRetries = config.openai.maxRetries;
    let lastError;

    const prompt = `You are Echo, a medical consultation assistant. You ONLY answer questions based on the consultation transcript provided below.

IMPORTANT RULES:
1. Answer ONLY using information from the transcript
2. If the question is unrelated to the consultation, say: "This question is not related to your consultation. Please ask about topics discussed with your doctor."
3. If the information is not in the transcript, say: "This wasn't discussed in your consultation. Please ask your doctor for more information."
4. Keep answers concise and specific (50-150 words)
5. Do not add medical advice beyond what was discussed
6. Do not make assumptions or provide general medical knowledge

CONSULTATION TRANSCRIPT:
${transcript}

PATIENT'S QUESTION: ${question}

Provide your answer based ONLY on the transcript above.`;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Chat response attempt ${attempt}/${maxRetries}`);

        const responsePromise = openai.chat.completions.create({
          model: config.openai.gptModel,
          messages: [
            {
              role: 'system',
              content: 'You are Echo, a medical consultation assistant. You only answer questions based on consultation transcripts. Never provide information outside of what was discussed.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3, // Lower temperature for more focused answers
          max_tokens: 300
        });

        // Add timeout wrapper
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Chat response timeout')), 60000); // 1 minute timeout
        });

        const response = await Promise.race([responsePromise, timeoutPromise]);

        const answer = response.choices[0].message.content;

        logger.info('Chat response generated successfully');
        return answer;
      } catch (error) {
        lastError = error;
        
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
          logger.error(`Chat response attempt ${attempt} failed - Network error:`, error.code);
        } else {
          logger.error(`Chat response attempt ${attempt} failed:`, error.message);
        }

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          logger.info(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.error('All chat response attempts failed');
    throw new Error(`Chat response failed after ${maxRetries} attempts: ${lastError.message}`);
  }
};

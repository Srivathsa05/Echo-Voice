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

const QUESTIONS_PROMPT = `You are a medical consultation assistant. Analyze this consultation transcript and generate 5-7 CRITICAL questions that patients commonly forget to ask but should have asked.

Focus on these categories:
1. **Medication-Specific Questions**: Side effects, interactions, timing with food, missed dose protocol
2. **Lifestyle & Dietary Questions**: Foods to avoid, alcohol restrictions, activity limitations, dietary changes
3. **Warning Signs & Red Flags**: When to seek emergency care, symptoms to watch for, normal vs concerning
4. **Follow-up & Timeline**: When to see doctor again, test result timing, recovery timeline
5. **Long-term Management**: Prognosis expectations, chronic condition management, preventive measures
6. **Alternative Options**: Second opinions, treatment alternatives, non-medical approaches
7. **Practical Concerns**: Cost, insurance coverage, prescription refills, at-home care instructions

CRITICAL RULES:
- Questions MUST be directly relevant to what was discussed in the consultation
- Do NOT invent topics not mentioned in the transcript
- Questions should be specific, actionable, and patient-focused
- Each question should address a genuine gap in the consultation
- Prioritize questions about safety and treatment adherence

Format as JSON:
{
  "questions": [
    "specific question about medication discussed",
    "specific question about lifestyle mentioned",
    "specific question about warning signs covered",
    "specific question about follow-up timeline",
    "specific question about dietary restrictions mentioned"
  ]
}

Do NOT include answers - only the questions themselves.`;

const SPECIALTY_PROMPT = `You are a medical specialist analyzer. Analyze this consultation transcript and determine the doctor's medical specialty.

Based on the medical terminology, conditions discussed, treatments mentioned, and the nature of the consultation, identify the most appropriate medical specialty.

Common specialties include:
- Cardiology (heart conditions, blood pressure, cholesterol)
- Neurology (brain, nerves, stroke, headaches)
- Orthopedics (bones, joints, muscles, fractures)
- Dermatology (skin conditions, rashes)
- Gastroenterology (digestive system, stomach, liver)
- Pulmonology (lungs, respiratory, asthma)
- Endocrinology (hormones, diabetes, thyroid)
- Oncology (cancer, tumors)
- Nephrology (kidneys)
- General Practice / Family Medicine (general health, checkups)
- Internal Medicine (adult health, complex conditions)
- Pediatrics (children's health)
- Obstetrics/Gynecology (women's health, pregnancy)
- Psychiatry (mental health)
- Ophthalmology (eyes)
- Otolaryngology (ENT, ears, nose, throat)
- Urology (urinary system)

Return ONLY the specialty name as a plain string. Do not include any explanation or additional text.`;

export const analysisService = {
  async detectSpecialty(transcript) {
    const maxRetries = config.openai.maxRetries;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Specialty detection attempt ${attempt}/${maxRetries}`);

        const responsePromise = openai.chat.completions.create({
          model: config.openai.gptModel,
          messages: [
            {
              role: 'system',
              content: 'You are a medical specialist analyzer. Always respond with just the specialty name.'
            },
            {
              role: 'user',
              content: `${SPECIALTY_PROMPT}\n\nTranscript:\n${transcript}`
            }
          ],
          temperature: 0.3,
          max_tokens: 50
        });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Specialty detection timeout')), 30000);
        });

        const response = await Promise.race([responsePromise, timeoutPromise]);
        const specialty = response.choices[0].message.content.trim();

        logger.info(`Specialty detected: ${specialty}`);
        return specialty;
      } catch (error) {
        lastError = error;
        
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
          logger.error(`Specialty detection attempt ${attempt} failed - Network error:`, error.code);
        } else {
          logger.error(`Specialty detection attempt ${attempt} failed:`, error.message);
        }

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          logger.info(`Retrying specialty detection in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.warn(`Specialty detection failed after ${maxRetries} attempts, using default`);
    return 'General Practice';
  },

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
        
        // Handle both formats: { questions: [...] } and [...]
        if (Array.isArray(questions)) {
          return questions;
        } else if (questions.questions && Array.isArray(questions.questions)) {
          return questions.questions;
        } else {
          logger.warn('Unexpected questions format:', questions);
          return [];
        }
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

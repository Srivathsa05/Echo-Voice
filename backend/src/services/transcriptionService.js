import OpenAI from 'openai';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import fs from 'fs/promises';
import fsSync from 'fs';
import { createReadStream } from 'fs';

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

export const transcriptionService = {
  async transcribeAudio(audioPath, options = {}) {
    const maxRetries = config.openai.maxRetries;
    let lastError;

    // Log file size for debugging
    try {
      const stats = await fs.stat(audioPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      logger.info(`Audio file size: ${fileSizeMB} MB`);
      
      if (stats.size > 5 * 1024 * 1024) {
        logger.warn(`File is large (${fileSizeMB} MB). This may cause connection issues with OpenAI API.`);
      }
    } catch (err) {
      logger.warn('Could not get file size:', err.message);
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Transcription attempt ${attempt}/${maxRetries}`);

        // Read file and create File object for OpenAI API
        const audioBuffer = await fs.readFile(audioPath);
        const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });

        logger.info(`Uploading ${audioBuffer.length} bytes to OpenAI Whisper API...`);

        // Add timeout to prevent hanging
        const transcriptionPromise = openai.audio.transcriptions.create({
          file: audioFile,
          model: config.openai.whisperModel,
          language: options.language || 'en',
          response_format: options.responseFormat || 'verbose_json',
          temperature: options.temperature || 0,
          timestamp_granularities: options.timestampGranularities || ['segment']
        });

        // Add timeout wrapper
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Transcription timeout')), 300000); // 5 minute timeout
        });

        const transcription = await Promise.race([transcriptionPromise, timeoutPromise]);

        logger.info('Transcription completed successfully');
        return transcription;
      } catch (error) {
        lastError = error;
        
        // Log detailed error information
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
          logger.error(`Transcription attempt ${attempt} failed - Network error:`, error.code);
          logger.error('This is likely due to: 1) File too large, 2) Network instability, 3) OpenAI API timeout');
        } else if (error.message === 'Transcription timeout') {
          logger.error(`Transcription attempt ${attempt} failed - Request timeout`);
        } else if (error.status === 413) {
          logger.error(`Transcription attempt ${attempt} failed - File too large for OpenAI API`);
        } else {
          logger.error(`Transcription attempt ${attempt} failed:`, error.message);
        }

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          logger.info(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.error('All transcription attempts failed');
    throw new Error(`Transcription failed after ${maxRetries} attempts: ${lastError.message}`);
  },

  parseTranscript(transcription) {
    const segments = transcription.segments || [];
    const speakers = this.identifySpeakers(segments);
    const cleanedText = this.cleanTranscript(transcription.text);

    return {
      rawText: transcription.text,
      cleanedText,
      segments,
      speakers,
      language: transcription.language,
      duration: transcription.duration
    };
  },

  identifySpeakers(segments) {
    const speakers = new Map();
    let currentSpeaker = 'Doctor'; // Default to doctor for first segment
    let speakerCount = 1;

    // Patterns to identify doctor speech
    const doctorPatterns = [
      /\b(take|prescribe|medication|medicine|pill|tablet|dosage|mg|twice daily|once daily)\b/i,
      /\b(diagnos|symptoms|condition|treatment|therapy|procedure)\b/i,
      /\b(blood pressure|heart rate|temperature|examine|check|test)\b/i,
      /\b(recommend|suggest|advice|should|need to)\b/i,
      /\b(doctor|dr\.|physician|medical)\b/i,
      /\b(\?+)$/ // Doctor often asks questions
    ];

    // Patterns to identify patient speech
    const patientPatterns = [
      /\b(i feel|i have|i'm experiencing|my pain|my symptom)\b/i,
      /\b(hurts|ache|pain|sore|uncomfortable)\b/i,
      /\b(scared|worried|concerned|anxious)\b/i,
      /\b(when can|how long|what should|i need to know)\b/i,
      /\b(patient)\b/i,
      /\b(\?+)$/ // Patient also asks questions
    ];

    segments.forEach((segment, index) => {
      const text = segment.text.trim();
      const lowerText = text.toLowerCase();

      // Count matches for doctor and patient patterns
      let doctorScore = 0;
      let patientScore = 0;

      doctorPatterns.forEach(pattern => {
        if (pattern.test(text)) doctorScore += 2;
      });

      patientPatterns.forEach(pattern => {
        if (pattern.test(text)) patientScore += 2;
      });

      // Additional heuristics
      if (text.includes('Dr.') || text.includes('Doctor')) doctorScore += 3;
      if (text.includes('I ') || text.includes('my ')) patientScore += 1;
      if (text.includes('you ') || text.includes('your ')) doctorScore += 1;
      if (text.includes('prescribe') || text.includes('take')) doctorScore += 3;
      if (text.includes('hurt') || text.includes('pain')) patientScore += 2;

      // Determine speaker based on scores and previous speaker
      if (index === 0) {
        // First segment - use scores to determine initial speaker
        currentSpeaker = doctorScore >= patientScore ? 'Doctor' : 'Patient';
      } else {
        const prevSpeaker = segments[index - 1].speaker;
        
        // If scores are similar, keep the same speaker (continuity)
        const scoreDiff = Math.abs(doctorScore - patientScore);
        if (scoreDiff < 2) {
          currentSpeaker = prevSpeaker;
        } else {
          // Switch to the speaker with higher score
          currentSpeaker = doctorScore > patientScore ? 'Doctor' : 'Patient';
        }
      }

      // Ensure speaker exists in map
      if (!speakers.has(currentSpeaker)) {
        speakers.set(currentSpeaker, {
          id: speakerCount++,
          name: currentSpeaker,
          segments: []
        });
      }

      // Add segment to speaker
      speakers.get(currentSpeaker).segments.push({
        start: segment.start,
        end: segment.end,
        text: segment.text
      });

      segment.speaker = currentSpeaker;
    });

    // Post-processing: ensure we have both speakers
    if (!speakers.has('Doctor')) {
      speakers.set('Doctor', { id: 1, name: 'Doctor', segments: [] });
    }
    if (!speakers.has('Patient')) {
      speakers.set('Patient', { id: 2, name: 'Patient', segments: [] });
    }

    return Array.from(speakers.values());
  },

  cleanTranscript(text) {
    let cleaned = text
      .replace(/\s+/g, ' ')
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\.{2,}/g, '.')
      .replace(/!{2,}/g, '!')
      .replace(/\?{2,}/g, '?')
      .trim();

    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

    return cleaned;
  },

  formatTranscriptWithSpeakers(segments) {
    return segments.map(segment => ({
      speaker: segment.speaker || 'Unknown',
      text: segment.text,
      startTime: segment.start,
      endTime: segment.end
    }));
  }
};

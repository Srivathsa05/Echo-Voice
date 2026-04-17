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
    let currentSpeaker = 'Doctor';
    let speakerCount = 1;

    // Strong doctor indicators
    const doctorPatterns = [
      /\b(take|prescribe|medication|medicine|pill|tablet|dosage|mg|twice daily|once daily|three times|every)\b/i,
      /\b(diagnos|condition|treatment|therapy|procedure|surgery)\b/i,
      /\b(blood pressure|heart rate|temperature|pulse|examine|check|test|lab|result)\b/i,
      /\b(recommend|suggest|advice|should|need to|must|have to)\b/i,
      /\b(doctor|dr\.|physician|medical|clinic|hospital)\b/i,
      /\b(\?+)$/ 
    ];

    // Strong patient indicators
    const patientPatterns = [
      /\b(i feel|i have|i'm experiencing|my pain|my symptom|i've been)\b/i,
      /\b(hurts|ache|pain|sore|uncomfortable|bothering|troubling)\b/i,
      /\b(scared|worried|concerned|anxious|nervous|afraid)\b/i,
      /\b(when can|how long|what should|i need to know|is it normal)\b/i,
      /\b(patient|me|i|my)\b/i,
      /\b(\?+)$/
    ];

    // Track conversation flow
    let consecutiveDoctor = 0;
    let consecutivePatient = 0;

    segments.forEach((segment, index) => {
      const text = segment.text.trim();
      
      let doctorScore = 0;
      let patientScore = 0;

      // Score doctor patterns
      doctorPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) doctorScore += matches.length * 3;
      });

      // Score patient patterns
      patientPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) patientScore += matches.length * 3;
      });

      // Additional heuristics with higher weights
      if (/^(yes|no|okay|alright|sure|thanks|thank you)/i.test(text)) {
        patientScore += 2;
      }
      
      if (/\b(let me|i would|i will|i can|i'm going to)\b/i.test(text)) {
        doctorScore += 2;
      }

      if (/\b(could you|can you|please|help)\b/i.test(text)) {
        patientScore += 3;
      }

      if (/\b(you should|you need|you must|we'll|we will)\b/i.test(text)) {
        doctorScore += 3;
      }

      if (/\b(i think|i believe|i guess|i suppose)\b/i.test(text)) {
        patientScore += 2;
      }

      if (/\b(the issue is|the problem is|what's happening|what's wrong)\b/i.test(text)) {
        patientScore += 2;
      }

      if (/\b(we need to|i recommend|i suggest|i advise)\b/i.test(text)) {
        doctorScore += 3;
      }

      // Adjust for conversation flow - penalize too many consecutive segments from same speaker
      if (index > 0) {
        const prevSpeaker = segments[index - 1].speaker;
        if (prevSpeaker === 'Doctor') {
          consecutiveDoctor++;
          consecutivePatient = 0;
        } else {
          consecutivePatient++;
          consecutiveDoctor = 0;
        }

        // If same speaker has too many consecutive segments, bias toward switching
        if (consecutiveDoctor >= 3) {
          patientScore += 2;
        }
        if (consecutivePatient >= 3) {
          doctorScore += 2;
        }
      }

      // Determine speaker
      if (index === 0) {
        currentSpeaker = doctorScore >= patientScore ? 'Doctor' : 'Patient';
      } else {
        const prevSpeaker = segments[index - 1].speaker;
        const scoreDiff = Math.abs(doctorScore - patientScore);
        
        // Strong evidence needed to switch speakers
        if (scoreDiff >= 3) {
          currentSpeaker = doctorScore > patientScore ? 'Doctor' : 'Patient';
        } else {
          // Alternate speakers if scores are similar but different from previous
          if (prevSpeaker === 'Doctor') {
            currentSpeaker = patientScore > doctorScore ? 'Patient' : 'Doctor';
          } else {
            currentSpeaker = doctorScore > patientScore ? 'Doctor' : 'Patient';
          }
        }
      }

      // Reset consecutive counters when speaker changes
      if (index > 0 && segments[index - 1].speaker !== currentSpeaker) {
        consecutiveDoctor = 0;
        consecutivePatient = 0;
      }

      // Ensure speaker exists
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

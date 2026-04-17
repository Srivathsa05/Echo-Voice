import { audioService } from './audioService.js';
import { transcriptionService } from './transcriptionService.js';
import { analysisService } from './analysisService.js';
import { sessionStore } from '../utils/sessionStore.js';
import { Transcript } from '../models/Transcript.js';
import { ConsultationSummary } from '../models/ConsultationSummary.js';
import { ForgottenQuestions } from '../models/ForgottenQuestions.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { consultationModel } from '../models/consultationModel.js';
import { logger } from '../utils/logger.js';

export const processingService = {
  async processUpload(sessionId, audioPath, io) {
    try {
      const session = await sessionStore.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.status.updateStage('upload', 10, 'Processing audio file...');
      await sessionStore.updateSession(sessionId, { status: session.status });
      this.emitProgress(io, sessionId, session.status);

      const audioResult = await audioService.processAudioFile(audioPath, sessionId);
      
      session.audioFile.duration = audioResult.duration;
      session.status.completeStage('upload', 'Audio processed successfully');
      await sessionStore.updateSession(sessionId, { audioFile: session.audioFile, status: session.status });
      this.emitProgress(io, sessionId, session.status);

      await this.transcribe(sessionId, audioResult.processedPath, io);
      await this.analyze(sessionId, io);
      await this.generate(sessionId, io);

      // Detect doctor specialty
      if (session.transcript && session.transcript.cleanedText) {
        try {
          const specialty = await analysisService.detectSpecialty(session.transcript.cleanedText);
          session.specialty = specialty;
          await sessionStore.updateSession(sessionId, { specialty });
          logger.info(`Specialty detected: ${specialty}`);
        } catch (error) {
          logger.error('Error detecting specialty:', error);
          session.specialty = 'General Practice';
        }
      }

      session.status.complete();
      await sessionStore.updateSession(sessionId, { status: session.status });
      this.emitProgress(io, sessionId, session.status);

      // Save to database if DATABASE_URL is configured
      if (process.env.DATABASE_URL) {
        try {
          const consultation = await consultationModel.getConsultationBySessionId(sessionId);
          let consultationId;

          if (!consultation) {
            // Create new consultation
            const created = await consultationModel.createConsultation({
              sessionId,
              doctorName: session.doctorName,
              patientName: session.patientName,
              audioFileName: session.audioFile.originalName,
              audioDuration: session.audioFile.duration,
              specialty: session.specialty || 'General Practice'
            });
            consultationId = created.id;
          } else {
            consultationId = consultation.id;
          }

          // Save transcript
          if (session.transcript) {
            await consultationModel.saveTranscript(consultationId, {
              rawText: session.transcript.rawText,
              cleanedText: session.transcript.cleanedText,
              segments: session.transcript.segments,
              language: session.transcript.language,
              duration: session.transcript.duration
            });
          }

          // Save summary
          if (session.summary) {
            await consultationModel.saveSummary(consultationId, session.summary);
          }

          // Save questions
          if (session.questions) {
            await consultationModel.saveQuestions(consultationId, {
              questions: session.questions.questions,
              answers: session.questions.answers || []
            });
          }

          logger.info(`Consultation saved to database: ${consultationId}`);
        } catch (dbError) {
          logger.error('Error saving to database:', dbError);
          // Don't fail the entire process if database save fails
        }
      }

      return session;
    } catch (error) {
      logger.error('Processing error:', error);
      const session = await sessionStore.getSession(sessionId);
      if (session) {
        session.status.failStage(session.status.currentStage, error.message);
        await sessionStore.updateSession(sessionId, { status: session.status });
        this.emitProgress(io, sessionId, session.status);
      }
      throw error;
    }
  },

  async transcribe(sessionId, audioPath, io) {
    const session = await sessionStore.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.status.updateStage('transcribe', 30, 'Transcribing audio...');
    await sessionStore.updateSession(sessionId, { status: session.status });
    this.emitProgress(io, sessionId, session.status);

    const transcription = await transcriptionService.transcribeAudio(audioPath);
    const parsedTranscript = transcriptionService.parseTranscript(transcription);

    const transcript = new Transcript({
      sessionId,
      rawText: parsedTranscript.rawText,
      cleanedText: parsedTranscript.cleanedText,
      speakers: parsedTranscript.speakers,
      segments: parsedTranscript.segments,
      language: parsedTranscript.language,
      duration: parsedTranscript.duration
    });

    session.transcript = transcript;
    session.status.completeStage('transcribe', 'Transcription completed');
    await sessionStore.updateSession(sessionId, { transcript, status: session.status });
    this.emitProgress(io, sessionId, session.status);
  },

  async analyze(sessionId, io) {
    const session = await sessionStore.getSession(sessionId);
    if (!session || !session.transcript) {
      throw new Error('Session or transcript not found');
    }

    session.status.updateStage('analyze', 60, 'Analyzing consultation...');
    await sessionStore.updateSession(sessionId, { status: session.status });
    this.emitProgress(io, sessionId, session.status);

    const summaryData = await analysisService.generateSummary(session.transcript.cleanedText);

    const summary = new ConsultationSummary({
      sessionId,
      diagnosis: summaryData.diagnosis || [],
      medications: summaryData.medications || [],
      nextSteps: summaryData.nextSteps || [],
      warnings: summaryData.warnings || [],
      importantNotes: summaryData.importantNotes || [],
      vitals: summaryData.vitals || [],
      lifestyle: summaryData.lifestyle || [],
      labs: summaryData.labs || []
    });

    session.summary = summary;
    session.status.completeStage('analyze', 'Analysis completed');
    await sessionStore.updateSession(sessionId, { summary, status: session.status });
    this.emitProgress(io, sessionId, session.status);
  },

  async generate(sessionId, io) {
    const session = await sessionStore.getSession(sessionId);
    if (!session || !session.transcript) {
      throw new Error('Session or transcript not found');
    }

    session.status.updateStage('generate', 80, 'Generating questions...');
    await sessionStore.updateSession(sessionId, { status: session.status });
    this.emitProgress(io, sessionId, session.status);

    const questionsData = await analysisService.generateQuestions(session.transcript.cleanedText);

    const questions = new ForgottenQuestions({
      sessionId,
      questions: questionsData,
      answers: []
    });

    session.questions = questions;
    session.status.completeStage('generate', 'Questions generated');
    await sessionStore.updateSession(sessionId, { questions, status: session.status });
    this.emitProgress(io, sessionId, session.status);
  },

  async processChat(sessionId, question, io) {
    const session = await sessionStore.getSession(sessionId);
    if (!session || !session.transcript) {
      throw new Error('Session or transcript not found');
    }

    const userMessage = new ChatMessage({
      sessionId,
      role: 'user',
      content: question
    });

    session.chatHistory.push(userMessage);

    const answer = await analysisService.answerChatQuestion(
      session.transcript.cleanedText,
      question
    );

    const assistantMessage = new ChatMessage({
      sessionId,
      role: 'assistant',
      content: answer
    });

    session.chatHistory.push(assistantMessage);
    await sessionStore.updateSession(sessionId, { chatHistory: session.chatHistory });

    return {
      question: userMessage.toJSON(),
      answer: assistantMessage.toJSON()
    };
  },

  emitProgress(io, sessionId, status) {
    if (io) {
      io.to(sessionId).emit('processing-progress', status.toJSON());
    }
  }
};

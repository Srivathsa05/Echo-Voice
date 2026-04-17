import { v4 as uuidv4 } from 'uuid';
import { AudioFile } from './AudioFile.js';
import { Transcript } from './Transcript.js';
import { ConsultationSummary } from './ConsultationSummary.js';
import { ForgottenQuestions } from './ForgottenQuestions.js';
import { ProcessingStatus } from './ProcessingStatus.js';

export class Session {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.doctorName = data.doctorName || 'Doctor';
    this.patientName = data.patientName || 'Patient';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.audioFile = data.audioFile || null;
    this.transcript = data.transcript || null;
    this.summary = data.summary || null;
    this.questions = data.questions || null;
    this.status = data.status || new ProcessingStatus({ sessionId: this.id });
    this.chatHistory = data.chatHistory || [];
    this.metadata = data.metadata || {};
  }

  toJSON() {
    return {
      id: this.id,
      doctorName: this.doctorName,
      patientName: this.patientName,
      createdAt: this.createdAt,
      audioFile: this.audioFile?.toJSON() || null,
      transcript: this.transcript?.toJSON() || null,
      summary: this.summary?.toJSON() || null,
      questions: this.questions?.toJSON() || null,
      status: this.status.toJSON(),
      chatHistory: this.chatHistory.map(msg => msg.toJSON()),
      metadata: this.metadata
    };
  }
}

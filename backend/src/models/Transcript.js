import { v4 as uuidv4 } from 'uuid';

export class Transcript {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.sessionId = data.sessionId;
    this.rawText = data.rawText || '';
    this.cleanedText = data.cleanedText || '';
    this.speakers = data.speakers || [];
    this.segments = data.segments || [];
    this.language = data.language || 'en';
    this.duration = data.duration || null;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      rawText: this.rawText,
      cleanedText: this.cleanedText,
      speakers: this.speakers,
      segments: this.segments,
      language: this.language,
      duration: this.duration,
      createdAt: this.createdAt
    };
  }
}

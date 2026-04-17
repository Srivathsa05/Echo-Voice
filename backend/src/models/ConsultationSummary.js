import { v4 as uuidv4 } from 'uuid';

export class ConsultationSummary {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.sessionId = data.sessionId;
    this.diagnosis = data.diagnosis || [];
    this.medications = data.medications || [];
    this.nextSteps = data.nextSteps || [];
    this.warnings = data.warnings || [];
    this.importantNotes = data.importantNotes || [];
    this.vitals = data.vitals || [];
    this.lifestyle = data.lifestyle || [];
    this.labs = data.labs || [];
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      diagnosis: this.diagnosis,
      medications: this.medications,
      nextSteps: this.nextSteps,
      warnings: this.warnings,
      importantNotes: this.importantNotes,
      vitals: this.vitals,
      lifestyle: this.lifestyle,
      labs: this.labs,
      createdAt: this.createdAt
    };
  }
}

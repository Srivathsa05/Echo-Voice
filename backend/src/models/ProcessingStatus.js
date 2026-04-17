import { v4 as uuidv4 } from 'uuid';

export class ProcessingStatus {
  constructor(data) {
    this.sessionId = data.sessionId;
    this.currentStage = data.currentStage || 'idle';
    this.progress = data.progress || 0;
    this.completed = data.completed || false;
    this.error = data.error || null;
    this.startTime = data.startTime || new Date().toISOString();
    this.endTime = data.endTime || null;
    this.stages = data.stages || {
      upload: { status: 'pending', progress: 0, message: '' },
      transcribe: { status: 'pending', progress: 0, message: '' },
      analyze: { status: 'pending', progress: 0, message: '' },
      generate: { status: 'pending', progress: 0, message: '' }
    };
  }

  updateStage(stage, progress, message) {
    this.currentStage = stage;
    this.progress = progress;
    if (this.stages[stage]) {
      this.stages[stage].status = 'in_progress';
      this.stages[stage].progress = progress;
      this.stages[stage].message = message;
    }
  }

  completeStage(stage, message) {
    if (this.stages[stage]) {
      this.stages[stage].status = 'completed';
      this.stages[stage].progress = 100;
      this.stages[stage].message = message;
    }
  }

  failStage(stage, error) {
    if (this.stages[stage]) {
      this.stages[stage].status = 'failed';
      this.stages[stage].message = error;
    }
    this.error = error;
  }

  complete() {
    this.completed = true;
    this.currentStage = 'completed';
    this.progress = 100;
    this.endTime = new Date().toISOString();
  }

  toJSON() {
    return {
      sessionId: this.sessionId,
      currentStage: this.currentStage,
      progress: this.progress,
      completed: this.completed,
      error: this.error,
      startTime: this.startTime,
      endTime: this.endTime,
      stages: this.stages
    };
  }
}

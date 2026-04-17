import { v4 as uuidv4 } from 'uuid';

export class ForgottenQuestions {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.sessionId = data.sessionId;
    this.questions = data.questions || [];
    this.answers = data.answers || [];
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      questions: this.questions,
      answers: this.answers,
      createdAt: this.createdAt
    };
  }
}

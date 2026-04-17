import { v4 as uuidv4 } from 'uuid';

export class ChatMessage {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.sessionId = data.sessionId;
    this.role = data.role;
    this.content = data.content;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.metadata = data.metadata || {};
  }

  toJSON() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      role: this.role,
      content: this.content,
      timestamp: this.timestamp,
      metadata: this.metadata
    };
  }
}

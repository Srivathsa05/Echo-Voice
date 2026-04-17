import { v4 as uuidv4 } from 'uuid';

export class AudioFile {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.filename = data.filename;
    this.filepath = data.filepath;
    this.uploadTime = data.uploadTime || new Date().toISOString();
    this.size = data.size;
    this.sessionId = data.sessionId;
    this.mimeType = data.mimeType;
    this.duration = data.duration || null;
  }

  toJSON() {
    return {
      id: this.id,
      filename: this.filename,
      filepath: this.filepath,
      uploadTime: this.uploadTime,
      size: this.size,
      sessionId: this.sessionId,
      mimeType: this.mimeType,
      duration: this.duration
    };
  }
}

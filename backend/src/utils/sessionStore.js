import { Session } from '../models/Session.js';
import { cache } from './cache.js';

const SESSION_PREFIX = 'session:';
const SESSION_LIST_PREFIX = 'sessions:';

export const sessionStore = {
  async createSession(data) {
    const session = new Session(data);
    cache.set(`${SESSION_PREFIX}${session.id}`, session);
    
    const sessions = this.getAllSessionIds();
    sessions.unshift(session.id);
    cache.set(SESSION_LIST_PREFIX, sessions);
    
    return session;
  },

  async getSession(sessionId) {
    return cache.get(`${SESSION_PREFIX}${sessionId}`);
  },

  async updateSession(sessionId, updates) {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      return null;
    }

    Object.assign(session, updates);
    cache.set(`${SESSION_PREFIX}${sessionId}`, session);
    
    return session;
  },

  async deleteSession(sessionId) {
    cache.delete(`${SESSION_PREFIX}${sessionId}`);
    
    const sessions = this.getAllSessionIds();
    const updatedSessions = sessions.filter(id => id !== sessionId);
    cache.set(SESSION_LIST_PREFIX, updatedSessions);
  },

  getAllSessionIds() {
    return cache.get(SESSION_LIST_PREFIX) || [];
  },

  async getAllSessions() {
    const sessionIds = this.getAllSessionIds();
    const sessions = [];
    
    for (const id of sessionIds) {
      const session = await this.getSession(id);
      if (session) {
        sessions.push(session);
      }
    }
    
    return sessions;
  },

  async searchSessions(query) {
    const sessions = await this.getAllSessions();
    const lowerQuery = query.toLowerCase();
    
    return sessions.filter(session => 
      session.doctorName.toLowerCase().includes(lowerQuery) ||
      session.patientName.toLowerCase().includes(lowerQuery) ||
      session.metadata?.title?.toLowerCase().includes(lowerQuery)
    );
  },

  async filterSessionsByTag(tag) {
    const sessions = await this.getAllSessions();
    
    return sessions.filter(session => 
      session.metadata?.tags?.includes(tag)
    );
  }
};

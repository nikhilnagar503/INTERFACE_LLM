/**
 * Database API client for frontend
 * Handles all CRUD operations for sessions, messages, and prompts via backend
 */

import { supabase } from './supabaseClient';
import { API_URL } from './api';

const API_BASE = `${API_URL}/api/db`;

/**
 * Get auth token from Supabase session
 */
async function getAuthToken() {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) {
    throw new Error('No authenticated session found');
  }
  return data.session.access_token;
}

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

// ==================== CHAT SESSIONS API ====================
export const sessionsAPI = {
  async createSession(title = 'New Chat', modelUsed = null) {
    return apiRequest('/sessions', {
      method: 'POST',
      body: JSON.stringify({ title, model_used: modelUsed }),
    });
  },

  async getSessions() {
    return apiRequest('/sessions');
  },

  async getSession(sessionId) {
    return apiRequest(`/sessions/${sessionId}`);
  },

  async updateSession(sessionId, updates) {
    return apiRequest(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: updates.title,
        model_used: updates.modelUsed,
      }),
    });
  },

  async deleteSession(sessionId) {
    return apiRequest(`/sessions/${sessionId}`, { method: 'DELETE' });
  },

  async archiveSession(sessionId) {
    return apiRequest(`/sessions/${sessionId}/archive`, { method: 'POST' });
  },
};

// ==================== CHAT MESSAGES API ====================
export const messagesAPI = {
  async saveMessage(sessionId, role, content, model = null, tokensUsed = null) {
    return apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        role,
        content,
        model,
        tokens_used: tokensUsed,
      }),
    });
  },

  async getMessages(sessionId) {
    return apiRequest(`/sessions/${sessionId}/messages`);
  },

  async deleteMessage(messageId) {
    return apiRequest(`/messages/${messageId}`, { method: 'DELETE' });
  },

  async clearSession(sessionId) {
    return apiRequest(`/sessions/${sessionId}/clear`, { method: 'POST' });
  },
};

// ==================== PROMPTS API ====================
export const promptsAPI = {
  async getSystemPrompts() {
    // System prompts don't require auth
    const response = await fetch(`${API_BASE}/prompts/system`);
    if (!response.ok) {
      throw new Error('Failed to fetch system prompts');
    }
    return response.json();
  },

  async getUserPrompts() {
    return apiRequest('/prompts');
  },

  async createPrompt(prompt) {
    return apiRequest('/prompts', {
      method: 'POST',
      body: JSON.stringify(prompt),
    });
  },

  async updatePrompt(promptId, updates) {
    return apiRequest(`/prompts/${promptId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deletePrompt(promptId) {
    return apiRequest(`/prompts/${promptId}`, { method: 'DELETE' });
  }
};

// ==================== AUTH API ====================
const authAPI = {
  async createProfile(profileData) {
    // Auth routes are at /api/auth, not /api/db/auth
    const token = await getAuthToken();    // this getauthToken return the token from supabase session
    const response = await fetch(`${API_URL}/api/auth/profile`, {  
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      // Profile may already exist, ignore error
      return {};
    }
    return response.json();   
  },
};

// ==================== UTILITY FUNCTIONS ====================
export const databaseAPI = {
  sessions: sessionsAPI,
  messages: messagesAPI,
  prompts: promptsAPI,
  auth: authAPI,
};

export default databaseAPI;

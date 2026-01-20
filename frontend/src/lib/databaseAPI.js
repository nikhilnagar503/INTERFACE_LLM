/**
 * Database API client for frontend
 * Handles all CRUD operations for sessions, messages, API keys, and settings
 */

import { supabase } from './supabaseClient';

const API_BASE = 'http://localhost:8000/api/db';

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

// ==================== SETTINGS API ====================
export const settingsAPI = {
  async getSettings() {
    return apiRequest('/settings');
  },

  async updateSettings(updates) {
    const params = new URLSearchParams();
    if (updates.temperature !== undefined) params.append('default_temperature', updates.temperature);
    if (updates.maxTokens !== undefined) params.append('default_max_tokens', updates.maxTokens);
    if (updates.sidebarCollapsed !== undefined) params.append('sidebar_collapsed', updates.sidebarCollapsed);
    
    return apiRequest(`/settings?${params.toString()}`, { method: 'PUT' });
  },
};

// ==================== API KEYS API ====================
export const apiKeysAPI = {
  async getApiKeys() {
    return apiRequest('/api-keys');
  },

  async saveApiKey(provider, apiKey) {
    return apiRequest(`/api-keys?provider=${provider}&api_key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
    });
  },

  async deleteApiKey(apiKeyId) {
    return apiRequest(`/api-keys/${apiKeyId}`, { method: 'DELETE' });
  },
};

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

// ==================== UTILITY FUNCTIONS ====================
export const databaseAPI = {
  settings: settingsAPI,
  apiKeys: apiKeysAPI,
  sessions: sessionsAPI,
  messages: messagesAPI,
};

export default databaseAPI;

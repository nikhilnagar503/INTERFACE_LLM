import React, { useEffect, useState } from 'react';
import { sessionsAPI, messagesAPI } from '../../lib/databaseAPI';
import './ChatSidebar.css';

function ChatSidebar({ currentSessionId, onSelectSession, onNewChat, session }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSession, setExpandedSession] = useState(null);

  // Load sessions on component mount and when session changes
  useEffect(() => {
    if (session?.user?.id) {
      loadSessions();
    }
  }, [session]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sessionsAPI.getSessions();
      setSessions(response || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const newSession = await sessionsAPI.createSession('New Chat');
      setSessions([newSession, ...sessions]);
      onNewChat(newSession.id);
    } catch (err) {
      console.error('Failed to create session:', err);
      setError('Failed to create new chat');
    }
  };

  const handleSelectSession = (sessionId) => {
    onSelectSession(sessionId);
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      try {
        await sessionsAPI.deleteSession(sessionId);
        setSessions(sessions.filter(s => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          // If deleting current session, switch to first available or create new
          if (sessions.length > 1) {
            const nextSession = sessions.find(s => s.id !== sessionId);
            onSelectSession(nextSession.id);
          } else {
            handleNewChat();
          }
        }
      } catch (err) {
        console.error('Failed to delete session:', err);
        setError('Failed to delete chat');
      }
    }
  };

  const handleArchiveSession = async (sessionId, e) => {
    e.stopPropagation();
    try {
      await sessionsAPI.archiveSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error('Failed to archive session:', err);
      setError('Failed to archive chat');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <aside className="chat-sidebar">
      {/* Header with new chat button */}
      <div className="chat-sidebar-header">
        <button className="new-chat-button" onClick={handleNewChat}>
          <span>➕</span> New Chat
        </button>
      </div>

      {/* Sessions list */}
      <div className="sessions-list">
        {error && (
          <div className="error-message">{error}</div>
        )}

        {loading ? (
          <div className="loading">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <p>No chats yet</p>
            <p className="empty-hint">Start a new conversation</p>
          </div>
        ) : (
          <div className="sessions-container">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`session-item ${currentSessionId === session.id ? 'active' : ''}`}
              >
                <button
                  className="session-button"
                  onClick={() => handleSelectSession(session.id)}
                  title={session.title}
                >
                  <div className="session-title">{session.title}</div>
                  <div className="session-meta">
                    <span className="message-count">{session.message_count} msgs</span>
                    <span className="session-time">{formatDate(session.last_message_at)}</span>
                  </div>
                </button>

                {/* Session actions */}
                <div className="session-actions">
                  <button
                    className="action-button"
                    onClick={(e) => handleArchiveSession(session.id, e)}
                    title="Archive chat"
                  >
                    📦
                  </button>
                  <button
                    className="action-button delete"
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    title="Delete chat"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

export default ChatSidebar;

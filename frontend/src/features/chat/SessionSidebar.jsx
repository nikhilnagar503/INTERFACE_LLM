import React, { useState, useEffect } from 'react';
import './SessionSidebar.css';

function SessionSidebar({ isExpanded, onToggle, onNewChat, onSelectSession, currentSessionId }) {
  const [sessions, setSessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSessions, setFilteredSessions] = useState([]);

  // Load sessions from localStorage
  useEffect(() => {
    const loadSessions = () => {
      const savedSessions = localStorage.getItem('chat_sessions');
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        // Sort by most recent first
        const sorted = parsed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setSessions(sorted);
        setFilteredSessions(sorted);
      }
    };

    loadSessions();
  }, []);

  // Filter sessions based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSessions(sessions);
    } else {
      const filtered = sessions.filter((session) =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.preview.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSessions(filtered);
    }
  }, [searchQuery, sessions]);

  const handleNewChat = () => {
    setSearchQuery('');
    onNewChat();
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    }
  };

  return (
    <aside className={`session-sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Toggle Button */}
      <button className="session-sidebar-toggle" onClick={onToggle} title={isExpanded ? 'Collapse' : 'Expand'}>
        <i className={`fas fa-chevron-${isExpanded ? 'left' : 'right'}`}></i>
      </button>

      {isExpanded && (
        <div className="session-sidebar-content">
          {/* Header */}
          <div className="session-header">
            <h3>Chats</h3>
          </div>

          {/* New Chat Button */}
          <button className="new-chat-btn" onClick={handleNewChat}>
            <i className="fas fa-plus"></i>
            <span>New Chat</span>
          </button>

          {/* Search Bar */}
          <div className="session-search">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Sessions List */}
          <div className="sessions-list">
            {filteredSessions.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-inbox"></i>
                <p>{searchQuery ? 'No chats found' : 'No chat history yet'}</p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <button
                  key={session.id}
                  className={`session-item ${currentSessionId === session.id ? 'active' : ''}`}
                  onClick={() => onSelectSession(session)}
                  title={session.title}
                >
                  <div className="session-item-content">
                    <p className="session-title">{session.title}</p>
                    <p className="session-preview">{session.preview}</p>
                  </div>
                  <span className="session-date">{formatDate(session.timestamp)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

export default SessionSidebar;

import React, { useState, useMemo } from 'react';
import './ChatSidebar.css';

function ChatSidebar({
  onNewChat,
  onSelectSession,
  currentSessionId,
  sessions = [],
  onClearSessions,
  onDeleteSession,
  onOpenSettings,
  onOpenProfile,
  session,
  userAvatar,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const query = searchQuery.toLowerCase();
    return sessions.filter((item) => (item.title || '').toLowerCase().includes(query));
  }, [sessions, searchQuery]);

  // Group sessions by time period
  const groupSessionsByDate = (sessionsList) => {
    const today = [];
    const last7Days = [];
    const older = [];
    const now = new Date();

    sessionsList.forEach((s) => {
      const date = new Date(s.timestamp);
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        today.push(s);
      } else if (diffDays <= 7) {
        last7Days.push(s);
      } else {
        older.push(s);
      }
    });

    return { today, last7Days, older };
  };

  const grouped = groupSessionsByDate(filteredSessions);
  const profileLabel = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Profile';
  const profileInitials = profileLabel
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderSessionItem = (s) => (
    <div
      key={s.id}
      className={`session-item ${currentSessionId === s.id ? 'active' : ''}`}
    >
      <button
        className="session-select"
        onClick={() => onSelectSession(s)}
        type="button"
      >
        <i className="fas fa-message"></i>
        <span className="session-title">{s.title}</span>
      </button>
      <button
        className="session-delete-btn"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDeleteSession?.(s.id);
        }}
        aria-label="Delete session"
        title="Delete session"
      >
        <i className="fas fa-trash"></i>
      </button>
    </div>
  );

  return (
    <aside className="chat-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <span className="logo-text">InterFace</span>
      </div>

      {/* New Chat & Search Row */}
      <div className="sidebar-actions">
        <button className="new-chat-btn" onClick={onNewChat}>
          <i className="fas fa-plus"></i>
          <span>New chat</span>
        </button>
        <div className="search-input">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conversations Header */}
      <div className="conversations-header">
        <span className="conversations-label">Your conversations</span>
        <button className="clear-all-btn" onClick={() => onClearSessions?.()}>Clear All</button>
      </div>


      {/* Sessions List */}
      <div className="sessions-list">
        {filteredSessions.length === 0 ? (
          <div className="empty-sessions">
            <i className="fas fa-inbox"></i>
            <p>{searchQuery ? 'No matching chats' : 'No chat history yet'}</p>
          </div>
        ) : (
          <>
            {grouped.today.length > 0 && (
              <>
                {grouped.today.map((s) => renderSessionItem(s))}
              </>
            )}
            {grouped.last7Days.length > 0 && (
              <>
                <div className="session-group-label">Last 7 Days</div>
                {grouped.last7Days.map((s) => renderSessionItem(s))}
              </>
            )}
            {grouped.older.length > 0 && (
              <>
                <div className="session-group-label">Older</div>
                {grouped.older.map((s) => renderSessionItem(s))}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="footer-btn" onClick={() => onOpenSettings?.()}>
          <i className="fas fa-cog"></i>
          <span>Settings</span>
        </button>
        <button className="footer-btn profile-btn" onClick={() => onOpenProfile?.()}>
          <div className="profile-avatar">
            {userAvatar ? (
              <img src={userAvatar} alt="Profile" />
            ) : (
              <span>{profileInitials || <i className="fas fa-user"></i>}</span>
            )}
          </div>
          <span>{profileLabel}</span>
        </button>
      </div>
    </aside>
  );
}

export default ChatSidebar;

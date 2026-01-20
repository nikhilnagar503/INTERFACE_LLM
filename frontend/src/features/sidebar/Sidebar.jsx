import React from 'react';
import './Sidebar.css';

function Sidebar({ currentPage, setCurrentPage, session, onNewChat, onExpandSessionSidebar }) {
  const handleNewChat = () => {
    setCurrentPage('chat');
    if (onNewChat) {
      onNewChat();
    }
  };

  const handleChatClick = () => {
    setCurrentPage('chat');
    if (onExpandSessionSidebar) {
      onExpandSessionSidebar();
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-placeholder">
          <i className="fas fa-cube"></i> 
          
        </div>
        <h2>INTERFACE</h2>
      </div>

      <nav className="sidebar-nav">
        <button
          className="nav-btn new-chat-nav-btn"
          onClick={handleNewChat}
          title="New Chat"
          data-tooltip="New Chat"
        >
          <i className="fas fa-plus"></i>
          <span>New Chat</span>
        </button>

        <button
          className={`nav-btn ${currentPage === 'chat' ? 'active' : ''}`}
          onClick={handleChatClick}
          title="Chat"
          data-tooltip="Chat"
        >
          <i className="fas fa-comments"></i>
          <span>Chat</span>
        </button>
      </nav>

      <div className="sidebar-bottom">
        <button
          className={`nav-btn ${currentPage === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentPage('settings')}
          title="Settings"
        >
          <i className="fas fa-cog"></i>
          <span>Settings</span>
        </button>

        <button
          className={`nav-btn profile-nav-btn ${currentPage === 'profile' ? 'active' : ''}`}
          onClick={() => setCurrentPage('profile')}
          title="Profile"
        >
          <div className="profile-avatar">
            <i className="fas fa-user"></i>
          </div>
          <span>Profile</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

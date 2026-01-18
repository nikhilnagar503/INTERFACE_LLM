import React from 'react';
import './Sidebar.css';


function Sidebar({ currentPage, setCurrentPage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-placeholder">
          <i className="fas fa-cube"></i> 
          
        </div>
        <h2>Interface</h2>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-btn ${currentPage === 'chat' ? 'active' : ''}`}
          onClick={() => setCurrentPage('chat')}
          title="Chat"
        >
          <i className="fas fa-comments"></i>
          <span>Chat</span>
        </button>
        <button
          className={`nav-btn ${currentPage === 'prompts' ? 'active' : ''}`}
          onClick={() => setCurrentPage('prompts')}
          title="Prompts"
        >
          <i className="fas fa-book"></i>
          <span>Prompts</span>
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
        
        <div className="profile-section">
          <div className="profile-avatar">
            <i className="fas fa-user"></i>
          </div>
          <div className="profile-info">
            <p className="profile-name">User</p>
            <p className="profile-email">user@interface.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

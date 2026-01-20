import React from 'react';
import { supabase } from '../../lib/supabaseClient';
import './Sidebar.css';

function Sidebar({ currentPage, setCurrentPage, session }) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
          className={`nav-btn ${currentPage === 'chat' ? 'active' : ''}`}
          onClick={() => setCurrentPage('chat')}
          title="Chat"
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
        
        <div className="profile-section" onClick={handleSignOut} style={{ cursor: 'pointer' }} title="Click to sign out">
          <div className="profile-avatar">
            <i className="fas fa-user"></i>
          </div>
          <div className="profile-info">
            <p className="profile-name">Authenticated</p>
            <p className="profile-email">{session?.user?.email || 'user@example.com'}</p>
            <p className="profile-signout">
              <i className="fas fa-sign-out-alt"></i> Sign out
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

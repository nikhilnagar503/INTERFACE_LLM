import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import './NavSidebar.css';

function NavSidebar({ currentPage, setCurrentPage, session }) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentPage('auth');
  };

  return (
    <nav className="nav-sidebar">
      {/* Logo/App Title */}
      <div className="nav-logo">
        <span className="logo-icon">💬</span>
      </div>

      {/* Navigation Buttons */}
      <div className="nav-buttons">
        {/* Chat Button */}
        <button
          className={`nav-button ${currentPage === 'chat' ? 'active' : ''}`}
          onClick={() => setCurrentPage('chat')}
          title="Chat"
        >
          <span className="nav-icon">💬</span>
        </button>

        {/* Settings Button */}
        <button
          className={`nav-button ${currentPage === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentPage('settings')}
          title="Settings"
        >
          <span className="nav-icon">⚙️</span>
        </button>
      </div>

      {/* User Profile Button */}
      <div className="nav-user">
        <button
          className="user-button"
          onClick={() => setShowUserMenu(!showUserMenu)}
          title={session?.user?.email}
        >
          <span className="user-avatar">👤</span>
        </button>

        {showUserMenu && (
          <div className="user-menu">
            <div className="user-email">{session?.user?.email}</div>
            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default NavSidebar;

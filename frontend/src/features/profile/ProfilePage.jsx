import React, { useEffect, useState } from 'react';
import './ProfilePage.css';

function ProfilePage({ session, onSignOut, onUpdateName }) {
  const user = session?.user;
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.username ||
    'User';
  const email = user?.email || 'unknown@email.com';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const [name, setName] = useState(displayName);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(displayName);
  }, [displayName]);

  const handleSaveName = async () => {
    if (!name.trim()) {
      setStatus('Name cannot be empty.');
      return;
    }
    setSaving(true);
    const result = await onUpdateName?.(name.trim());
    if (result?.error) {
      setStatus('Failed to update name.');
    } else {
      setStatus('Name updated successfully.');
    }
    setSaving(false);
    setTimeout(() => setStatus(''), 2500);
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-large">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" />
            ) : (
              <i className="fas fa-user"></i>
            )}
          </div>
          <div className="profile-title">
            <h1>{displayName}</h1>
            <p>{email}</p>
          </div>
        </div>

        <div className="profile-details">
          <div className="profile-card">
            <div className="profile-card-label">Name</div>
            <div className="profile-card-edit">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="profile-input"
                placeholder="Your name"
              />
              <button
                className="profile-save-btn"
                onClick={handleSaveName}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          <div className="profile-card">
            <div className="profile-card-label">Email</div>
            <div className="profile-card-value">{email}</div>
          </div>
        </div>

        <div className="profile-actions">
          <button className="profile-signout-btn" onClick={onSignOut}>
            <i className="fas fa-sign-out-alt"></i> Sign out
          </button>
          {status && <span className="profile-status">{status}</span>}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;

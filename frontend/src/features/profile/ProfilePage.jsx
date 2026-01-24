import React, { useEffect, useState } from 'react';
import './ProfilePage.css';

function ProfilePage({ session, onSignOut, onUpdateName, onUpdateAvatar, onClose, userAvatar }) {
  const user = session?.user;
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.username ||
    'User';
  const email = user?.email || 'unknown@email.com';
  const avatarUrl = userAvatar || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const [name, setName] = useState(displayName);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(avatarUrl || '');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setName(displayName);
  }, [displayName]);

  useEffect(() => {
    setAvatarPreview(avatarUrl || '');
  }, [avatarUrl]);

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

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setStatus('Please choose an image smaller than 2 MB.');
      setTimeout(() => setStatus(''), 2500);
      return;
    }
    const reader = new FileReader();
    setUploading(true);
    reader.onloadend = async () => {
      const result = reader.result?.toString();
      if (!result) {
        setUploading(false);
        return;
      }
      setAvatarPreview(result);
      const response = await onUpdateAvatar?.(result);
      if (response?.error) {
        setStatus('Unable to update avatar.');
      } else {
        setStatus('Profile photo updated.');
      }
      setUploading(false);
      setTimeout(() => setStatus(''), 2500);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarRemove = async () => {
    setUploading(true);
    const response = await onUpdateAvatar?.('');
    if (response?.error) {
      setStatus('Unable to remove avatar.');
    } else {
      setAvatarPreview('');
      setStatus('Profile photo removed.');
    }
    setUploading(false);
    setTimeout(() => setStatus(''), 2500);
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {onClose && (
          <button className="page-close-btn" onClick={onClose} title="Back to Chat">
            <i className="fas fa-times"></i>
          </button>
        )}
        {onClose && (
          <button className="back-to-chat-btn" onClick={onClose}>
            <i className="fas fa-arrow-left"></i> Back to Chat
          </button>
        )}
        <div className="profile-header">
          <div className="profile-avatar-large">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile" />
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
          <div className="profile-card avatar-card">
            <div className="profile-card-label">Profile photo</div>
            <div className="avatar-edit-row">
              <div className="avatar-preview">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" />
                ) : (
                  <i className="fas fa-user"></i>
                )}
              </div>
              <div className="avatar-actions">
                <label className="avatar-upload-btn">
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} />
                  {uploading ? 'Uploading...' : 'Upload photo'}
                </label>
                {avatarPreview && (
                  <button type="button" className="remove-avatar-btn" onClick={handleAvatarRemove} disabled={uploading}>
                    Remove photo
                  </button>
                )}
                <p className="avatar-hint">PNG or JPG, recommended 1:1 ratio, max 2 MB.</p>
              </div>
            </div>
          </div>
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

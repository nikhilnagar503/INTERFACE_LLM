import React, { useState } from 'react';
import './SettingsPage.css';

function SettingsPage({ apiKeys, onSaveApiKeys }) {
  const [keys, setKeys] = useState(apiKeys);
  const [showPasswords, setShowPasswords] = useState({
    openai: false,
    anthropic: false,
    gemini: false,
    groq: false,
  });
  const [saveStatus, setSaveStatus] = useState('');

  const providers = [
    { id: 'openai', name: 'OpenAI API Key', placeholder: 'sk-...' },
    { id: 'anthropic', name: 'Anthropic API Key', placeholder: 'sk-ant-...' },
    { id: 'gemini', name: 'Google Gemini API Key', placeholder: 'AIza...' },
    { id: 'groq', name: 'Groq API Key', placeholder: 'gsk_...' },
  ];

  const handleInputChange = (provider, value) => {
    setKeys({
      ...keys,
      [provider]: value,
    });
  };

  const toggleShowPassword = (provider) => {
    setShowPasswords({
      ...showPasswords,
      [provider]: !showPasswords[provider],
    });
  };

  const handleSave = () => {
    onSaveApiKeys(keys);
    setSaveStatus('✓ API Keys saved successfully!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your API keys and preferences</p>
        </div>

        <div className="settings-section">
          <h2>API Keys</h2>
          <p className="section-description">
            Enter your API keys to use different AI providers. Your keys are stored securely in your browser.
          </p>

          <div className="api-keys-container">
            {providers.map((provider) => (
              <div key={provider.id} className="api-key-field">
                <label htmlFor={provider.id}>{provider.name}</label>
                <div className="input-wrapper">
                  <input
                    id={provider.id}
                    type={showPasswords[provider.id] ? 'text' : 'password'}
                    value={keys[provider.id]}
                    onChange={(e) => handleInputChange(provider.id, e.target.value)}
                    placeholder={provider.placeholder}
                    className="api-input"
                  />
                  <button
                    className="toggle-btn"
                    onClick={() => toggleShowPassword(provider.id)}
                    title={showPasswords[provider.id] ? 'Hide' : 'Show'}
                  >
                    <i className={`fas fa-eye${showPasswords[provider.id] ? '' : '-slash'}`}></i>
                  </button>
                </div>
                <a href={`https://platform.openai.com/api-keys`} target="_blank" rel="noopener noreferrer" className="get-key-link">
                  Get API key here
                </a>
              </div>
            ))}
          </div>

          <div className="settings-actions">
            <button className="btn-save" onClick={handleSave}>
              <i className="fas fa-save"></i> Save API Keys
            </button>
            {saveStatus && <span className="save-status">{saveStatus}</span>}
          </div>
        </div>

        <div className="settings-info">
          <i className="fas fa-shield-alt"></i>
          <p>Your API keys are stored locally in your browser's storage and are never sent to our servers.</p>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;

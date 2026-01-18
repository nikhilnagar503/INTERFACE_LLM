import React, { useState, useEffect } from 'react';
import { API_URL } from '../../lib/api';
import './ConfigPanel.css';

function ConfigPanel({ onConfigSuccess }) {
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [sessionId, setSessionId] = useState(`session-${Date.now()}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasDefault, setHasDefault] = useState(false);
  const [autoConfigLoading, setAutoConfigLoading] = useState(true);

  const modelOptions = {
    openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'],
    gemini: ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    groq: ['mixtral-8x7b-32768', 'llama-2-70b-4096'],
  };

  // Check for default configuration on mount
  useEffect(() => {
    const checkDefaultConfig = async () => {
      try {
        const response = await fetch(`${API_URL}/api/config`);
        const data = await response.json();
        
        if (data.has_default) {
          setHasDefault(true);
          // Auto-configure with defaults
          setTimeout(() => {
            handleDefaultConfig(data.default_provider, data.default_model);
          }, 500);
        }
      } catch (err) {
        console.log('No default config available');
      } finally {
        setAutoConfigLoading(false);
      }
    };

    checkDefaultConfig();
  }, []);

  const handleDefaultConfig = async (defaultProvider, defaultModel) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: defaultProvider,
          api_key: 'default',
          model: defaultModel,
          session_id: 'default',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Default configuration failed');
      }

      setProvider(defaultProvider);
      setModel(defaultModel);
      onConfigSuccess(data);
    } catch (err) {
      setError('Failed to apply default configuration: ' + err.message);
      setAutoConfigLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (e) => {
    const newProvider = e.target.value;
    setProvider(newProvider);
    setModel(modelOptions[newProvider][0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          api_key: apiKey,
          model,
          session_id: sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Configuration failed');
      }

      onConfigSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (autoConfigLoading) {
    return (
      <div className="config-panel">
        <div className="config-card">
          <div className="config-header">
            <i className="fas fa-cog"></i>
            <h2>Initializing Configuration...</h2>
          </div>
          <div className="config-form" style={{ textAlign: 'center' }}>
            <p>Loading default settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="config-panel">
      <div className="config-card">
        <div className="config-header">
          <i className="fas fa-cog"></i>
          <h2>{hasDefault ? 'Using Default Configuration' : 'Configure Your LLM'}</h2>
          {hasDefault && <span className="default-badge">Default Active</span>}
        </div>

        {hasDefault && (
          <div className="default-info" style={{
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#4CAF50'
          }}>
            ✓ Default LLM provider is configured and ready to use! You can start chatting now.
          </div>
        )}

        <form onSubmit={handleSubmit} className="config-form">
          <div className="form-group">
            <label htmlFor="provider">
              <i className="fas fa-server"></i> Provider
            </label>
            <select
              id="provider"
              value={provider}
              onChange={handleProviderChange}
              className="form-control"
              disabled={hasDefault && loading}
            >
              <option value="openai">OpenAI</option>
              <option value="gemini">Google Gemini</option>
              <option value="anthropic">Anthropic Claude</option>
              <option value="groq">Groq</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="model">
              <i className="fas fa-brain"></i> Model
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="form-control"
            >
              {modelOptions[provider].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="apiKey">
              <i className="fas fa-key"></i> API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="form-control"
              required
            />
            <small className="form-help">
              {provider === 'openai' ? (
                <>
                  Get your key from{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OpenAI Platform
                  </a>
                </>
              ) : (
                <>
                  Get your key from{' '}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google AI Studio
                  </a>
                </>
              )}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="sessionId">
              <i className="fas fa-fingerprint"></i> Session ID
            </label>
            <input
              id="sessionId"
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Unique session identifier"
              className="form-control"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Connecting...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i> Start Chatting
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ConfigPanel;

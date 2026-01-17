import React, { useState, useEffect, useRef } from 'react';
import WelcomePage from '../welcome/WelcomePage';
import { API_URL } from '../../lib/api';
import models from './models';
import './ChatInterface.css';

function ChatInterface({ selectedModel, setSelectedModel, apiKeys }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(`session-${Date.now()}`);
  const [showModelModal, setShowModelModal] = useState(false);
  const [searchModel, setSearchModel] = useState('');
  const messagesEndRef = useRef(null);



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message to chat
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Determine provider from model name
      let provider = 'openai';
      if (selectedModel.includes('claude')) provider = 'anthropic';
      if (selectedModel.includes('gemini')) provider = 'gemini';
      if (selectedModel.includes('mixtral') || selectedModel.includes('llama')) provider = 'groq';

      // Get API key from storage
      const apiKeyKey = `api_key_${provider}`;
      const apiKey = localStorage.getItem(apiKeyKey);

      if (!apiKey) {
        throw new Error(`No API key found for ${provider}. Please configure it in Settings.`);
      }

      // First, configure the backend if not already done
      const configureResponse = await fetch(`${API_URL}/api/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: provider,
          api_key: apiKey,
          model: selectedModel,
          session_id: sessionId,
        }),
      });

      if (!configureResponse.ok) {
        const configError = await configureResponse.json();
        throw new Error(configError.detail || 'Failed to configure LLM');
      }

      // Now send the chat message with conversation history
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
          history: messages, // Send entire conversation history for context
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to get response');
      }

      // Add assistant response to chat
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'error',
          content: `Error: ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Show welcome page if no messages
  if (messages.length === 0) {
    const allModels = Object.entries(models).flatMap(([provider, modelList]) =>
      modelList.map((model) => ({ provider, name: model }))
    );
    const filteredModels = allModels.filter((m) =>
      m.name.toLowerCase().includes(searchModel.toLowerCase())
    );

    return (
      <div className="chat-interface">
        {showModelModal && (
          <div className="model-modal-overlay" onClick={() => setShowModelModal(false)}>
            <div className="model-modal" onClick={(e) => e.stopPropagation()}>
              <div className="model-modal-header">
                <span className="model-modal-title">
                  <i className="fas fa-brain"></i> {selectedModel}
                </span>
                <span className="model-count">400K</span>
              </div>
              <div className="model-search">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search models..."
                  value={searchModel}
                  onChange={(e) => setSearchModel(e.target.value)}
                  className="model-search-input"
                />
              </div>
              <div className="model-list">
                {filteredModels.length > 0 ? (
                  filteredModels.map((model) => (
                    <button
                      key={model.name}
                      className={`model-item ${
                        selectedModel === model.name ? 'active' : ''
                      }`}
                      onClick={() => {
                        setSelectedModel(model.name);
                        setShowModelModal(false);
                        setSearchModel('');
                      }}
                    >
                      <span className="model-item-left">
                        <i className="fas fa-brain"></i>
                        <span>{model.name}</span>
                      </span>
                      <span className="model-item-right">
                        <span className="model-cost">400K</span>
                        <button className="model-add-btn">
                          <i className="fas fa-plus"></i>
                        </button>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="model-empty">No models found</div>
                )}
              </div>
              <button className="model-manage-btn">
                <i className="fas fa-cog"></i> Manage Models
              </button>
            </div>
          </div>
        )}

        <div className="chat-content">
          <WelcomePage />
        </div>

        <div className="chat-input-section">
          <div className="input-actions-row">
            <button
              type="button"
              className="model-select-btn"
              onClick={() => setShowModelModal(!showModelModal)}
            >
              <span className="model-name">{selectedModel}</span>
              <i className="fas fa-chevron-down"></i>
            </button>
            <button
              type="button"
              className="action-btn"
              title="Add"
              onClick={() => {}}
            >
              <i className="fas fa-plus"></i>
            </button>
            <button
              type="button"
              className="action-btn"
              title="Attach file"
              onClick={() => {}}
            >
              <i className="fas fa-paperclip"></i>
            </button>
            <button
              type="button"
              className="action-btn"
              title="Voice input"
              onClick={() => {}}
            >
              <i className="fas fa-microphone"></i>
            </button>
            <button
              type="button"
              className="action-btn action-btn-highlight"
              title="Create"
              onClick={() => {}}
            >
              <i className="fas fa-square"></i>
            </button>
            <button
              type="button"
              className="action-btn"
              title="Ideas"
              onClick={() => {}}
            >
              <i className="fas fa-lightbulb"></i>
            </button>
            <button
              type="button"
              className="action-btn"
              title="Timer"
              onClick={() => {}}
            >
              <i className="fas fa-hourglass-end"></i>
            </button>
          </div>
          <form onSubmit={handleSend} className="chat-input-form">
            <div className="chat-input-wrapper">
              <div className="input-row">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type '@' to mention an AI agent"
                  className="chat-input"
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="btn-send"
                  disabled={loading || !input.trim()}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Show chat interface if there are messages
  const allModels = Object.entries(models).flatMap(([provider, modelList]) =>
    modelList.map((model) => ({ provider, name: model }))
  );
  const filteredModels = allModels.filter((m) =>
    m.name.toLowerCase().includes(searchModel.toLowerCase())
  );

  return (
    <div className="chat-interface">
      {showModelModal && (
        <div className="model-modal-overlay" onClick={() => setShowModelModal(false)}>
          <div className="model-modal" onClick={(e) => e.stopPropagation()}>
            <div className="model-modal-header">
              <span className="model-modal-title">
                <i className="fas fa-brain"></i> {selectedModel}
              </span>
              <span className="model-count">400K</span>
            </div>
            <div className="model-search">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search models..."
                value={searchModel}
                onChange={(e) => setSearchModel(e.target.value)}
                className="model-search-input"
              />
            </div>
            <div className="model-list">
              {filteredModels.length > 0 ? (
                filteredModels.map((model) => (
                  <button
                    key={model.name}
                    className={`model-item ${
                      selectedModel === model.name ? 'active' : ''
                    }`}
                    onClick={() => {
                      setSelectedModel(model.name);
                      setShowModelModal(false);
                      setSearchModel('');
                    }}
                  >
                    <span className="model-item-left">
                      <i className="fas fa-brain"></i>
                      <span>{model.name}</span>
                    </span>
                    <span className="model-item-right">
                      <span className="model-cost">400K</span>
                      <button className="model-add-btn">
                        <i className="fas fa-plus"></i>
                      </button>
                    </span>
                  </button>
                ))
              ) : (
                <div className="model-empty">No models found</div>
              )}
            </div>
            <button className="model-manage-btn">
              <i className="fas fa-cog"></i> Manage Models
            </button>
          </div>
        </div>
      )}

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message message-${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? (
                <i className="fas fa-user"></i>
              ) : msg.role === 'error' ? (
                <i className="fas fa-exclamation-triangle"></i>
              ) : (
                <i className="fas fa-robot"></i>
              )}
            </div>
            <div className="message-content">
              <div className="message-header">
                {msg.role === 'user'
                  ? 'You'
                  : msg.role === 'error'
                  ? 'Error'
                  : 'Assistant'}
              </div>
              <div className="message-text">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="message message-assistant">
            <div className="message-avatar">
              <i className="fas fa-robot"></i>
            </div>
            <div className="message-content">
              <div className="message-header">Assistant</div>
              <div className="message-text typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-section">
        <div className="input-actions-row">
          <button
            type="button"
            className="model-select-btn"
            onClick={() => setShowModelModal(!showModelModal)}
          >
            <span className="model-name">{selectedModel}</span>
            <i className="fas fa-chevron-down"></i>
          </button>
          <button
            type="button"
            className="action-btn"
            title="Add"
            onClick={() => {}}
          >
            <i className="fas fa-plus"></i>
          </button>
          <button
            type="button"
            className="action-btn"
            title="Attach file"
            onClick={() => {}}
          >
            <i className="fas fa-paperclip"></i>
          </button>
          <button
            type="button"
            className="action-btn"
            title="Voice input"
            onClick={() => {}}
          >
            <i className="fas fa-microphone"></i>
          </button>
          <button
            type="button"
            className="action-btn action-btn-highlight"
            title="Create"
            onClick={() => {}}
          >
            <i className="fas fa-square"></i>
          </button>
          <button
            type="button"
            className="action-btn"
            title="Ideas"
            onClick={() => {}}
          >
            <i className="fas fa-lightbulb"></i>
          </button>
          <button
            type="button"
            className="action-btn"
            title="Timer"
            onClick={() => {}}
          >
            <i className="fas fa-hourglass-end"></i>
          </button>
        </div>
        <form onSubmit={handleSend} className="chat-input-form">
          <div className="chat-input-wrapper">
            <div className="input-row">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type '@' to mention an AI agent"
                className="chat-input"
                disabled={loading}
              />
              <button
                type="submit"
                className="btn-send"
                disabled={loading || !input.trim()}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatInterface;

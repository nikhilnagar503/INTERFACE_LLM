import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import WelcomePage from '../welcome/WelcomePage';
import { API_URL } from '../../lib/api';
import models from './models';
import './ChatInterface.css';

function ChatInterface({ selectedModel, setSelectedModel, apiKeys, session }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(`session-${Date.now()}`);
  const [showModelModal, setShowModelModal] = useState(false);
  const [searchModel, setSearchModel] = useState('');
  const [currentProvider, setCurrentProvider] = useState('');
  const messagesEndRef = useRef(null);

  // Get provider logo SVG path
  const renderProviderLogo = (provider) => {
    const logos = {
      openai: '/logos/openai.svg',
      anthropic: '/logos/anthropic.svg',
      gemini: '/logos/gemini.svg',
      groq: '/logos/groq.svg'
    };
    return logos[provider || currentProvider] || '/logos/openai.svg';
  };

  // Add contextual emojis to response
  const enhanceWithEmojis = (text) => {
    let enhanced = text;
    
    // Add emojis contextually based on content
    enhanced = enhanced.replace(/(^|\n)(#{1,3})\s*([^\n]+)/g, (match, prefix, hashes, title) => {
      let emoji = '';
      const lowerTitle = title.toLowerCase();
      
      if (lowerTitle.includes('example') || lowerTitle.includes('demo')) emoji = '💡 ';
      else if (lowerTitle.includes('note') || lowerTitle.includes('important')) emoji = '📌 ';
      else if (lowerTitle.includes('warning') || lowerTitle.includes('caution')) emoji = '⚠️ ';
      else if (lowerTitle.includes('tip') || lowerTitle.includes('hint')) emoji = '💭 ';
      else if (lowerTitle.includes('step') || lowerTitle.includes('guide')) emoji = '📍 ';
      else if (lowerTitle.includes('code') || lowerTitle.includes('syntax')) emoji = '💻 ';
      else if (lowerTitle.includes('feature') || lowerTitle.includes('benefit')) emoji = '✅ ';
      else if (lowerTitle.includes('error') || lowerTitle.includes('issue')) emoji = '❌ ';
      else if (lowerTitle.includes('success') || lowerTitle.includes('complete')) emoji = '✨ ';
      else if (lowerTitle.includes('question') || lowerTitle.includes('help')) emoji = '❓ ';
      
      return `${prefix}${hashes} ${emoji}${title}`;
    });
    
    return enhanced;
  };



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    if (!session?.access_token) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'error',
          content: 'Please sign in on the Account tab before chatting.',
        },
      ]);
      return;
    }

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
      
      setCurrentProvider(provider);

      const authHeader = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      // Get API key from storage using user ID
      const userId = session?.user?.id;
      const apiKeyKey = `api_key_${provider}_${userId}`;
      const apiKey = localStorage.getItem(apiKeyKey);

      if (!apiKey) {
        throw new Error(`No API key found for ${provider}. Please configure it in Settings.`);
      }

      // First, configure the backend if not already done
      const cleanHistory = messages.filter((m) => m.role === 'user' || m.role === 'assistant');

      const configureResponse = await fetch(`${API_URL}/api/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
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

      // Add empty assistant message that we'll stream into
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '',
          provider: provider,
        },
      ]);

      // Now send the chat message with conversation history using streaming
      const response = await fetch(`${API_URL}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
          history: cleanHistory, // Send filtered conversation history for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get streaming response');
      }

      // Read the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line) continue;

          try {
            const data = JSON.parse(line);

            if (data.error) {
              throw new Error(data.error);
            }

            if (data.chunk) {
              streamedContent += data.chunk;
              // Update the last assistant message with streamed content
              setMessages((prev) => {
                const updated = [...prev];
                if (updated[updated.length - 1]?.role === 'assistant') {
                  updated[updated.length - 1].content = enhanceWithEmojis(streamedContent);
                  updated[updated.length - 1].provider = provider;
                }
                return updated;
              });
            }

            if (data.done) {
              // Streaming complete
              break;
            }
          } catch (e) {
            // Skip parsing errors for incomplete lines
            continue;
          }
        }
      }
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
                '👤'
              ) : msg.role === 'error' ? (
                '⚠️'
              ) : (
                <img src={renderProviderLogo(msg.provider)} alt="AI Provider" className="provider-logo" />
              )}
            </div>
            <div className="message-content">
              <div className="message-text">
                {msg.role === 'user' || msg.role === 'error' ? (
                  msg.content
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="message message-assistant">
            <div className="message-avatar">
              <img src={renderProviderLogo(currentProvider)} alt="AI Provider" className="provider-logo" />
            </div>
            <div className="message-content">
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

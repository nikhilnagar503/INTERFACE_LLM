import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import WelcomePage from '../welcome/WelcomePage';
import PromptLibrary from '../prompts/PromptLibrary';
import { API_URL } from '../../lib/api';
import { databaseAPI } from '../../lib/databaseAPI';
import models from './models';
import './ChatInterface.css';

// ChatInterface: main chat screen that orchestrates message flow, UI state,
// model selection, and integration with the backend streaming API.
function ChatInterface({
  selectedModel,
  setSelectedModel,
  apiKeys,
  session,
  sessionId: propSessionId,
  messages: externalMessages,
  onMessagesChange,
  onSessionUpdate,
  initialPrompt,
  onPromptUsed,
  onOpenSettings,
  userAvatar,
}) {
  // Local UI state (controlled by this component)
  const [messages, setMessages] = useState(externalMessages || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(propSessionId || `session-${Date.now()}`);
  const [showModelModal, setShowModelModal] = useState(false); // model picker visibility
  const [searchModel, setSearchModel] = useState('');
  const [currentProvider, setCurrentProvider] = useState(''); // for logo while streaming
  const [showPromptLibrary, setShowPromptLibrary] = useState(false); // prompt modal visibility
  const [copiedMessageId, setCopiedMessageId] = useState(null); // highlight copied message
  const messagesEndRef = useRef(null); // anchor to keep scroll at bottom
  const inputRef = useRef(null);

  // Keep internal sessionId in sync with the selected session (sidebar selection)
  useEffect(() => {
    if (propSessionId) {
      setSessionId(propSessionId);
    }
  }, [propSessionId]);

  // Sync messages when the parent changes sessions (per-session history)
  useEffect(() => {
    setMessages(externalMessages || []);
  }, [externalMessages]);

  // Helper to update messages and notify parent store
  // This keeps local state + the per-session store in sync.
  const updateMessages = (updater) => {
    setMessages((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      onMessagesChange?.(next);
      return next;
    });
  };

  const updateMessageByLocalId = (localId, updates) => {
    if (!localId) return;
    updateMessages((prev) => prev.map((msg) => (msg.localId === localId ? { ...msg, ...updates } : msg)));
  };

  // If a prompt is selected elsewhere, prefill the input and close the library
  useEffect(() => {
    if (initialPrompt?.content) {
      setInput(initialPrompt.content);
      onPromptUsed?.();
    }
  }, [initialPrompt, onPromptUsed]);

  // Auto-scroll to newest message whenever the list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.style.height = '0px';
    inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
  }, [input]);

  // Resolve provider name to logo asset for the message avatar
  const renderProviderLogo = (provider) => {
    const logos = {
      openai: '/logos/openai.svg',
      anthropic: '/logos/anthropic.svg',
      gemini: '/logos/gemini.svg',
      groq: '/logos/groq.svg',
    };
    return logos[provider || currentProvider] || '/logos/openai.svg';
  };

  const getModelContext = (provider) => {
    const contextMap = {
      openai: '400K',
      anthropic: '200K',
      gemini: '1M',
      groq: '128K',
    };
    return contextMap[provider] || '400K';
  };

  // Add emojis to headings for readability (e.g., ✅ Feature, ⚠️ Warning)
  const enhanceWithEmojis = (text) => {
    if (!text) return text;
    let enhanced = text;
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

  // Friendly timestamp formatting for message time display
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_error) {
      return 'Just now';
    }
  };

  // Copy assistant response to clipboard and show a brief "Copied" state
  const handleCopyMessage = (content, index) => {
    if (!content) return;
    try {
      navigator.clipboard.writeText(content);
      setCopiedMessageId(index);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Clipboard error:', error);
    }
  };

  // Apply a selected prompt from PromptLibrary to the input field
  const handlePromptSelected = (prompt) => {
    if (!prompt?.content) return;
    setInput(prompt.content);
    onPromptUsed?.();
    setShowPromptLibrary(false);
  };

  // Placeholder: plugins button
  const handlePluginsClick = () => {
    console.log('Plugins coming soon');
  };

  // Placeholder: agents button
  const handleAgentsClick = () => {
    console.log('Agents coming soon');
  };

  // Floating shortcut buttons for quick access (plugins/agents/prompts)
  const renderFloatingControls = () => (
    <div className="floating-controls">
      {/* Plugins shortcut */}
      <button
        type="button"
        className="floating-control-btn plugin-btn"
        onClick={handlePluginsClick}
        title="Open plugins"
      >
        <span className="fab-icon">
          <i className="fas fa-plug"></i>
        </span>
        <span className="fab-label">Plugins</span>
      </button>
      {/* Agents shortcut */}
      <button
        type="button"
        className="floating-control-btn agent-btn"
        onClick={handleAgentsClick}
        title="Open agents"
      >
        <span className="fab-icon">
          <i className="fas fa-robot"></i>
        </span>
        <span className="fab-label">Agents</span>
      </button>
      
      {/* Prompt library shortcut */}
      <button
        type="button"
        className="floating-control-btn prompt-fab"
        onClick={() => setShowPromptLibrary(true)}
        title="Browse prompt library"
      >
        <span className="fab-icon">✦</span>
        <span className="fab-label">Prompts</span>
      </button>
    </div>
  );

  // Send a user message and stream the assistant response
  // Steps:
  // 1) Validate input + auth
  // 2) Add user message to UI
  // 3) Configure provider + model on backend
  // 4) Stream assistant response and append to the last assistant bubble
  const sendMessageText = async (text, { updateTitle = true } = {}) => {
    if (!text.trim() || loading) return;

    // Require auth before chatting (backend expects a session token)
    if (!session?.access_token) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'error',
          content: 'Please sign in on the Account tab before chatting.',
          timestamp: new Date().toISOString(),
        },
      ]);
      return;
    }

    // Add user message to UI and update session title in the sidebar
    const userMessage = text.trim();
    const messageTimestamp = new Date().toISOString();
    setInput('');
    if (updateTitle) {
      onSessionUpdate?.(sessionId, {
        title: userMessage.slice(0, 60),
        timestamp: messageTimestamp,
      });
    }
    const userLocalId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    updateMessages((prev) => [
      ...prev,
      {
        localId: userLocalId,
        role: 'user',
        content: userMessage,
        timestamp: messageTimestamp,
      },
    ]);
    setLoading(true);

    try {
      // Resolve provider from selected model name
      // (simple name-based mapping; adjust if you add new providers)
      let provider = 'openai';
      if (selectedModel.toLowerCase().includes('claude')) provider = 'anthropic';
      if (selectedModel.toLowerCase().includes('gemini')) provider = 'gemini';
      if (selectedModel.toLowerCase().includes('mixtral') || selectedModel.toLowerCase().includes('llama')) {
        provider = 'groq';
      }
      setCurrentProvider(provider);

      // Load API key for this provider + user (stored in localStorage)
      const authHeader = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
      const userId = session?.user?.id;
      const apiKeyKey = `api_key_${provider}_${userId}`;
      const apiKey = localStorage.getItem(apiKeyKey);
      if (!apiKey) {
        throw new Error(`No API key found for ${provider}. Please configure it in Settings.`);
      }

      // Send only user/assistant history to backend (skip errors/system)
      const cleanHistory = messages.filter((msg) => msg.role === 'user' || msg.role === 'assistant');

      // Configure backend session (provider + API key + model)
      let configureResponse;
      try {
        configureResponse = await fetch(`${API_URL}/api/configure`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader,
          },
          body: JSON.stringify({
            provider,
            api_key: apiKey,
            model: selectedModel,
            session_id: sessionId,
          }),
        });
      } catch (networkError) {
        console.error('Configure fetch error:', networkError);
        throw new Error(`Network error: ${networkError.message}. Is the backend running at ${API_URL}?`);
      }

      if (!configureResponse.ok) {
        const configError = await configureResponse.json();
        throw new Error(configError.detail || 'Failed to configure LLM');
      }
      
      // Save user message to Supabase
      try {
        const saved = await databaseAPI.messages.saveMessage(sessionId, 'user', userMessage);
        if (saved?.id) {
          updateMessageByLocalId(userLocalId, { id: saved.id });
        }
        console.log('✅ User message saved to Supabase');
      } catch (error) {
        console.error('❌ Failed to save user message:', error);
        console.error('Session ID:', sessionId);
      }

      // Stream assistant response
      const response = await fetch(`${API_URL}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
          history: cleanHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get streaming response');
      }

      // Read streaming chunks and append to the last assistant message
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';
      
      // Add placeholder assistant message for streaming (UI updates as chunks arrive)
      const assistantLocalId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      updateMessages((prev) => [
        ...prev,
        {
          localId: assistantLocalId,
          role: 'assistant',
          content: '',
          provider,
          timestamp: new Date().toISOString(),
        },
      ]);

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
              updateMessages((prev) => {
                const updated = [...prev];
                if (updated[updated.length - 1]?.role === 'assistant') {
                  updated[updated.length - 1].content = enhanceWithEmojis(streamedContent);
                  updated[updated.length - 1].provider = provider;
                }
                return updated;
              });
            }
            if (data.done) {
              break;
            }
          } catch (_err) {
            continue;
          }
        }
      }
      
      // Save assistant message to Supabase
      if (streamedContent) {
        try {
          const saved = await databaseAPI.messages.saveMessage(sessionId, 'assistant', streamedContent, selectedModel);
          if (saved?.id) {
            updateMessageByLocalId(assistantLocalId, { id: saved.id });
          }
          console.log('✅ Assistant message saved to Supabase');
        } catch (error) {
          console.error('❌ Failed to save assistant message:', error);
          console.error('Session ID:', sessionId);
        }
      }
    } catch (err) {
      // Any failure becomes a visible error bubble in the chat
      console.error('Chat error:', err);
      updateMessages((prev) => [
        ...prev,
        {
          role: 'error',
          content: `Error: ${err.message}. Please check that the backend is running and you have configured your API key in Settings.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    await sendMessageText(input, { updateTitle: true });
  };

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend(event);
    }
  };

  const handleEditMessage = (content) => {
    if (!content) return;
    setInput(content);
    inputRef.current?.focus();
  };

  const handleDeleteMessage = async (message, index) => {
    try {
      if (message?.id) {
        await databaseAPI.messages.deleteMessage(message.id);
      }
      updateMessages((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleRegenerate = (index) => {
    const previousUser = [...messages].slice(0, index).reverse().find((msg) => msg.role === 'user');
    if (!previousUser?.content) return;
    sendMessageText(previousUser.content, { updateTitle: false });
  };

  // Resolve user display name + initials for avatars
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'You';
  const userInitials = userName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Chat header text based on latest user message
  const latestUserMessage = [...messages].reverse().find((msg) => msg.role === 'user');
  const conversationHeadingRaw = latestUserMessage?.content?.split('\n')[0] || 'Create a chatbot GPT using Python language';
  const conversationHeading = conversationHeadingRaw.length > 80 ? `${conversationHeadingRaw.slice(0, 77)}...` : conversationHeadingRaw;
  const conversationSubtitle = messages.length > 0
    ? `Using ${selectedModel} · ${messages.length} message${messages.length === 1 ? '' : 's'}`
    : 'Ask anything — get curated steps, guides, and answers instantly.';
  const hasMessages = messages.length > 0; // controls empty state vs message list

  // Flatten model lists for the model picker
  const allModels = Object.entries(models).flatMap(([provider, list]) =>
    list.map((model) => ({ provider, name: model }))
  );
  const filteredModels = allModels.filter((model) =>
    model.name.toLowerCase().includes(searchModel.toLowerCase())
  );

  const shouldShowTyping = loading && !(
    messages[messages.length - 1]?.role === 'assistant' &&
    !messages[messages.length - 1]?.content
  );

  // Render UI
  return (
    <div className="chat-interface">
      {/* Floating quick actions */}
      {renderFloatingControls()}

      {/* Model picker modal */}
      {showModelModal && (
        <div className="model-modal-overlay" onClick={() => setShowModelModal(false)}>
          <div className="model-modal" onClick={(e) => e.stopPropagation()}>
            <div className="model-modal-header">
              <span className="model-modal-title">
                <i className="fas fa-brain"></i> {selectedModel}
              </span>
              <span className="model-count">{filteredModels.length} models</span>
            </div>
            <div className="model-current">
              <div className="model-row-main">
                <span className="model-avatar" aria-hidden="true">
                  <img src={renderProviderLogo(selectedModel)} alt="" />
                </span>
                <span className="model-row-name">{selectedModel}</span>
              </div>
              <span className="model-row-context">{getModelContext('openai')}</span>
            </div>
            <div className="model-search">
              <i className="fas fa-search"></i>
              {/* Model search input */}
              <input
                type="text"
                placeholder="Search models..."
                value={searchModel}
                onChange={(e) => setSearchModel(e.target.value)}
                className="model-search-input"
              />
            </div>
            <div className="model-modal-body">
              {filteredModels.length > 0 ? (
                <div className="model-list">
                  {filteredModels.map((model) => (
                    <button
                      key={model.name}
                      type="button"
                      className={`model-row ${selectedModel === model.name ? 'active' : ''}`}
                      // Select a model from the list
                      onClick={() => {
                        setSelectedModel(model.name);
                        setShowModelModal(false);
                        setSearchModel('');
                      }}
                    >
                      <div className="model-row-main">
                        <span className="model-avatar" aria-hidden="true">
                          <img src={renderProviderLogo(model.provider)} alt="" />
                        </span>
                        <span className="model-row-name">{model.name}</span>
                      </div>
                      <div className="model-row-meta">
                        <span className="model-row-context">{getModelContext(model.provider)}</span>
                        <button
                          type="button"
                          className="model-row-action"
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`Add ${model.name}`}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
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

      <div className="chat-shell">
        {hasMessages ? (
          // Message timeline
          <div className="chat-messages">
            {messages.map((msg, index) => {
              // Message role flags
              const isUser = msg.role === 'user';
              const isAssistant = msg.role === 'assistant';
              const isError = msg.role === 'error';
              // Displayed author label in UI
              const authorLabel = isUser ? userName : isError ? 'System' : 'CHAT A.I +';
              const key = msg.timestamp ? `${msg.timestamp}-${index}` : `message-${index}`;
              return (
                <div key={key} className={`message message-${msg.role}`}>
                  <div className="message-avatar">
                    {/* Avatar based on role */}
                    {isUser ? (
                      userAvatar ? (
                        <img src={userAvatar} alt={userName} />
                      ) : (
                        <span className="avatar-fallback">{userInitials}</span>
                      )
                    ) : isError ? (
                      <span className="avatar-fallback warning">!</span>
                    ) : (
                      <img src={renderProviderLogo(msg.provider)} alt="AI Provider" className="provider-logo" />
                    )}
                  </div>
                  <div className="message-bubble">
                    <div className="message-meta">
                      <span className="message-author">{authorLabel}</span>
                      <span className="message-time">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className="message-text">
                      {/* Render markdown for assistant, plain text for user/error */}
                      {isAssistant ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
                    </div>
                    {(isAssistant || isUser) && msg.content && (
                      <div className="message-actions">
                        <button
                          type="button"
                          className={copiedMessageId === index ? 'copied' : ''}
                          onClick={() => handleCopyMessage(msg.content, index)}
                        >
                          <i className="fas fa-copy"></i>
                          {copiedMessageId === index ? 'Copied' : 'Copy'}
                        </button>
                        {isUser && (
                          <button type="button" onClick={() => handleEditMessage(msg.content)}>
                            <i className="fas fa-pen"></i> Edit
                          </button>
                        )}
                        {isAssistant && (
                          <button type="button" onClick={() => handleRegenerate(index)}>
                            <i className="fas fa-rotate-right"></i> Regenerate
                          </button>
                        )}
                        <button type="button" onClick={() => handleDeleteMessage(msg, index)}>
                          <i className="fas fa-trash"></i> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {shouldShowTyping && (
              // Typing indicator while waiting for stream
              <div className="message message-assistant typing-message">
                <div className="message-avatar">
                  <img src={renderProviderLogo(currentProvider)} alt="AI Provider" className="provider-logo" />
                </div>
                <div className="message-bubble">
                  <div className="message-meta">
                    <span className="message-author">CHAT A.I +</span>
                    <span className="message-time">Typing…</span>
                  </div>
                  <div className="message-text typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          // Empty state (welcome + quick prompts)
          <div className="chat-empty-state">
            <WelcomePage
              // Clicking a suggestion inserts it into the input
              onSuggestionClick={(text) => setInput(text)}
              hasApiKeys={Object.values(apiKeys).some((key) => key !== '')}
              onOpenSettings={onOpenSettings}
            />
          </div>
        )}

        {/* Composer / input area */}
        <div className="chat-input-section">
          <div className="input-actions-row">
            <button
              type="button"
              className="model-select-btn"
              // Toggle model picker
              onClick={() => setShowModelModal(!showModelModal)}
            >
              <span className="model-name">{selectedModel}</span>
              <i className="fas fa-chevron-down"></i>
            </button>


            {/* <button  type="button" className="action-btn" title="Browse templates">
              <i className="fas fa-plus"></i>
            </button> */}

            {/* <button type="button" className="action-btn" title="Attach file" onClick={() => {}}>
              <i className="fas fa-paperclip"></i>
            </button>

            <button type="button" className="action-btn" title="Voice input" onClick={() => {}}>
              <i className="fas fa-microphone"></i>
            </button>

            <button type="button" className="action-btn action-btn-highlight" title="Create" onClick={() => {}}>
              <i className="fas fa-square"></i>
            </button>

            <button type="button" className="action-btn" title="Ideas" onClick={() => {}}>
              <i className="fas fa-lightbulb"></i>
            </button>
            
            <button type="button" className="action-btn" title="Timer" onClick={() => {}}>
              <i className="fas fa-hourglass-end"></i>
            </button> */}
          </div>
          <form onSubmit={handleSend} className="chat-input-form">
            <div className="chat-input-wrapper">
              <div className="input-row">
                <span className="input-emoji">😊</span>
                {/* User input text field */}
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="What's in your mind?..."
                  className="chat-input"
                  disabled={loading}
                  rows={1}
                />
                {/* Send button */}
                <button type="submit" className="btn-send" disabled={loading || !input.trim()}>
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Prompt library modal */}
      <PromptLibrary
        isModal
        isOpen={showPromptLibrary}
        onClose={() => setShowPromptLibrary(false)}
        onPromptSelected={handlePromptSelected}
      />
    </div>
  );
}

export default ChatInterface;

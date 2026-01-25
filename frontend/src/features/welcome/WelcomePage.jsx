import React from 'react';
import './WelcomePage.css';

function WelcomePage({ onSuggestionClick, hasApiKeys, onOpenSettings }) {
  const suggestionCards = [
    {
      id: 'draft',
      icon: '📝',
      title: 'Draft a proposal',
      description: 'Create a one‑page project proposal for a new feature launch',
    },
    {
      id: 'summary',
      icon: '📌',
      title: 'Summarize a meeting',
      description: 'Turn raw notes into clear action items and owners',
    },
    {
      id: 'sql',
      icon: '🧩',
      title: 'Generate SQL',
      description: 'Write a query to track weekly active users by plan',
    },
    {
      id: 'support',
      icon: '💬',
      title: 'Reply to a customer',
      description: 'Draft a friendly response for a billing question',
    },
    {
      id: 'roadmap',
      icon: '🗺️',
      title: 'Brainstorm roadmap',
      description: 'List high‑impact features for Q2 planning',
    },
    {
      id: 'release',
      icon: '🚀',
      title: 'Write release notes',
      description: 'Summarize changes for v2.4.0 in a concise format',
    },
  ];

  const handleCardClick = (card) => {
    if (onSuggestionClick) {
      onSuggestionClick(card.title.replace(/"/g, '') + ' ' + card.description);
    }
  };

  return (
    <div className="welcome-page">
      <div className="welcome-content">
        {/* API Key Banner */}
        {!hasApiKeys && (
          <div className="api-key-banner">
            <div className="banner-icon">🔑</div>
            <div className="banner-content">
              <h3>Configure API Keys to Get Started</h3>
              <p>Add at least one API key to start chatting with AI models.</p>
            </div>
            <button className="banner-btn" onClick={onOpenSettings}>
              Configure API Keys
            </button>
          </div>
        )}

        {/* Badge */}
        <div className="welcome-badge">
          <span>WORKSPACE ASSISTANT</span>
        </div>

        {/* Headline */}
        <h1 className="welcome-headline">What would you like to build today?</h1>
        <p className="welcome-subtitle">
          Get fast help with product, engineering, and support tasks. Start with a prompt below.
        </p>

        {/* Suggestion Cards Grid */}
        <div className="suggestions-grid">
          {suggestionCards.map((card) => (
            <button
              key={card.id}
              className={`suggestion-card ${card.dark ? 'dark' : 'light'}`}
              onClick={() => handleCardClick(card)}
            >
              <div className="card-icon">{card.icon}</div>
              <div className="card-content">
                <h3 className="card-title">{card.title}</h3>
                <p className="card-description">{card.description}</p>
              </div>
              {card.hasArrow && (
                <div className="card-arrow">
                  <i className="fas fa-arrow-right"></i>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;

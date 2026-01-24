import React from 'react';
import './WelcomePage.css';

function WelcomePage({ onSuggestionClick, hasApiKeys, onOpenSettings }) {
  const suggestionCards = [
    {
      id: 'explore',
      icon: '🌐',
      title: 'Explore',
      description: 'Learn how to use chat.ai platform for your needs',
      dark: true,
    },
    {
      id: 'explain',
      icon: '💭',
      title: '"Explain"',
      description: 'Quantum computing in simple terms"',
      hasArrow: true,
    },
    {
      id: 'howto',
      icon: '🔧',
      title: '"How to"',
      description: 'Make a search engine platform like google',
      hasArrow: true,
    },
    {
      id: 'capabilities',
      icon: '⚡',
      title: 'Capabilities',
      description: 'How much capable chat.ai to full-fill your needs',
      dark: true,
    },
    {
      id: 'remember',
      icon: '🧠',
      title: '"Remember"',
      description: 'quantum computing in simple terms"',
      hasArrow: true,
    },
    {
      id: 'allows',
      icon: '✅',
      title: '"Allows"',
      description: 'User to provide follow-up corrections',
      hasArrow: true,
    },
    {
      id: 'limitation',
      icon: '⚠️',
      title: 'Limitation',
      description: 'How much capable chat.ai to full-fill your needs',
      dark: true,
    },
    {
      id: 'may',
      icon: '❌',
      title: '"May"',
      description: 'Occasionally generate incorrect information',
      hasArrow: true,
    },
    {
      id: 'limited',
      icon: '📅',
      title: '"Limited"',
      description: 'Knowledge of world and events after 2021',
      hasArrow: true,
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
          <span>CHAT A.I+</span>
        </div>

        {/* Headline */}
        <h1 className="welcome-headline">Good day! How may I assist you today?</h1>

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

import React from 'react';
import './WelcomePage.css';

function WelcomePage() {
  const suggestions = [
    {
      icon: 'fas fa-pen',
      title: 'Write Copy',
      description: 'Create engaging content for emails, blogs, and more.',
    },
    {
      icon: 'fas fa-images',
      title: 'Image Generation',
      description: 'Generate images using AI powered image generation.',
    },
    {
      icon: 'fas fa-magnifying-glass',
      title: 'Research',
      description: 'Quickly gather and summarize information.',
    },
    {
      icon: 'fas fa-code',
      title: 'Generate Code',
      description: 'Produce accurate code lists and documentation.',
    },
    {
      icon: 'fas fa-chart-line',
      title: 'Data Analytics',
      description: 'Analyze data with advanced insights.',
    },
    {
      icon: 'fas fa-globe',
      title: 'Web Search',
      description: 'Find information online with text-based search capabilities.',
    },
  ];

  return (
    <div className="welcome-page">
      <div className="welcome-header">
        <div className="logo-large">
          <i className="fas fa-cube"></i>
        </div>
        <h1>Welcome to Interface</h1>
        <p>Chat with AI. Break down lengthy texts into concise summaries to grasp.</p>
      </div>

      <div className="suggestions-grid">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="suggestion-card">
            <div className="suggestion-icon">
              <i className={suggestion.icon}></i>
            </div>
            <h3>{suggestion.title}</h3>
            <p>{suggestion.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WelcomePage;

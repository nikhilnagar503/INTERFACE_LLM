import React from 'react';

/**
 * PromptCard Component
 * Individual card representing a prompt template in the marketplace
 */
function PromptCard({ prompt, onSelect, isSelected }) {
  return (
    <div className={`prompt-card ${isSelected ? 'selected' : ''}`}>
      <div className="card-content">
        <h3 className="card-title">{prompt.title}</h3>
        <p className="card-description">{prompt.description}</p>
        
        <div className="card-tags">
          {prompt.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      </div>

      <div className="card-actions">
        <button 
          className={`btn-select ${isSelected ? 'selected' : ''}`}
          onClick={() => onSelect(prompt)}
          title={isSelected ? 'Selected' : 'Add to chat'}
        >
          {isSelected ? '✓' : '+'}
        </button>
      </div>
    </div>
  );
}

export default PromptCard;

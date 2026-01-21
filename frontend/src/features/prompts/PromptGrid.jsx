import React from 'react';
import PromptCard from './PromptCard';

/**
 * PromptGrid Component
 * Renders a grid/list of prompt cards
 */
function PromptGrid({ prompts, selectedPrompts, onSelectPrompt, isLoading }) {
  console.log('PromptGrid rendering:', { promptsCount: prompts.length, isLoading });
  
  if (isLoading) {
    return (
      <div className="prompt-grid loading">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-title"></div>
            <div className="skeleton-desc"></div>
            <div className="skeleton-tags"></div>
          </div>
        ))}
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="prompt-grid empty">
        <div className="empty-state">
          <p>📭 No prompts found</p>
          <p style={{ fontSize: '13px', color: '#999', marginTop: '8px' }}>Try adjusting your search or filters</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: '12px', fontSize: '14px', color: '#555', fontWeight: '500' }}>
        Found <strong>{prompts.length}</strong> template{prompts.length !== 1 ? 's' : ''}
      </div>
      <div className="prompt-grid">
        {prompts.map(prompt => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            onSelect={onSelectPrompt}
            isSelected={selectedPrompts.includes(prompt.id)}
          />
        ))}
      </div>
    </>
  );
}

export default PromptGrid;

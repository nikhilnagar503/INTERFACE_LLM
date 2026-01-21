import React from 'react';

/**
 * PromptSearchBar Component
 * Search and filter controls for the marketplace
 */
function PromptSearchBar({ searchTerm, onSearchChange, selectedTag, onTagChange, allTags, onClear }) {
  return (
    <div className="prompt-search-bar">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="🔍 Search prompts..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="filter-section">
        <label htmlFor="tag-filter">Filter by tags:</label>
        <select 
          id="tag-filter"
          value={selectedTag} 
          onChange={(e) => onTagChange(e.target.value)}
          className="tag-filter"
        >
          <option value="">All Tags</option>
          {allTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      {(searchTerm || selectedTag) && (
        <button className="btn-clear-filters" onClick={onClear}>
          Clear Filters
        </button>
      )}
    </div>
  );
}

export default PromptSearchBar;

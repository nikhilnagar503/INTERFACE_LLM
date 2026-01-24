import React, { useState, useEffect } from 'react';
import PromptSearchBar from './PromptSearchBar';
import PromptGrid from './PromptGrid';
import { fetchPromptTemplates, PROMPT_TEMPLATES, addCustomPrompt, getCustomPrompts } from './promptTemplates';
import './PromptMarketplace.css';

/**
 * PromptMarketplace Component
 * Lazy-loaded, cacheable prompt template browser with custom prompt support
 * 
 * Props:
 * - isOpen: boolean - controls modal visibility
 * - onClose: function - callback to close marketplace
 * - onSelectPrompt: function - callback when user selects a prompt
 * - selectedPrompts: array - list of currently selected prompt IDs
 */
function PromptMarketplace({ isOpen, onClose, onSelectPrompt, selectedPrompts = [] }) {
  const [templates, setTemplates] = useState([...PROMPT_TEMPLATES]); // Initialize with built-in templates
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [error, setError] = useState(null);
  const [newPromptForm, setNewPromptForm] = useState({
    title: '',
    description: '',
    content: '',
    tags: ''
  });

  // Extract all unique tags from templates
  const allTags = [...new Set(templates.flatMap(p => p.tags))];

  // Load templates on first open (lazy load + cache)
  useEffect(() => {
    if (isOpen && templates.length === 0) {
      loadTemplates();
    }
  }, [isOpen]);

  // Load templates from cache or API
  const loadTemplates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Check if cached in localStorage
      const cachedTemplates = localStorage.getItem('promptTemplates');
      if (cachedTemplates) {
        const parsed = JSON.parse(cachedTemplates);
        setTemplates(parsed);
      } else {
        // Fetch from API (or use built-in)
        const data = await fetchPromptTemplates();
        setTemplates(data);
        // Cache for future use
        localStorage.setItem('promptTemplates', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Failed to load templates. Using default templates.');
      setTemplates(PROMPT_TEMPLATES);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter templates based on search and tags
  const filteredTemplates = templates.filter(prompt => {
    const matchesSearch = 
      prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || prompt.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  // Handle template selection
  const handleSelectTemplate = (template) => {
    onSelectPrompt(template);
  };

  // Handle adding new custom prompt
  const handleAddPrompt = () => {
    if (!newPromptForm.title || !newPromptForm.content) {
      alert('Please fill in title and content');
      return;
    }
    
    const prompt = {
      title: newPromptForm.title,
      description: newPromptForm.description,
      content: newPromptForm.content,
      tags: newPromptForm.tags ? newPromptForm.tags.split(',').map(t => t.trim()) : ['Custom']
    };
    
    addCustomPrompt(prompt);
    
    // Refresh templates to show new custom prompt
    const customPrompts = getCustomPrompts();
    setTemplates([
      ...templates.filter(t => t.isBuiltIn),
      ...customPrompts
    ]);
    
    // Reset form
    setNewPromptForm({ title: '', description: '', content: '', tags: '' });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedTag('');
  };

  if (!isOpen) return null;

  console.log('PromptMarketplace rendering:', { isOpen, templatesCount: templates.length, isLoading, filteredCount: filteredTemplates.length });

  return (
    <div className="prompt-marketplace-overlay">
      <div className="prompt-marketplace-modal">
        <div className="marketplace-header">
          <h2>📚 Prompt Marketplace</h2>
          <p>Browse and add prompt templates to your chat</p>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className="error-banner">{error}</div>
        )}

        <div className="marketplace-content">
          <div className="marketplace-toolbar">
            <PromptSearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedTag={selectedTag}
              onTagChange={setSelectedTag}
              allTags={allTags}
              onClear={handleClearFilters}
            />
          </div>

          {false && null}

          <div className="marketplace-info">
            <p>{filteredTemplates.length} template(s) found</p>
            {selectedPrompts.length > 0 && (
              <p className="selected-count">{selectedPrompts.length} selected</p>
            )}
          </div>

          <PromptGrid
            prompts={filteredTemplates}
            selectedPrompts={selectedPrompts}
            onSelectPrompt={handleSelectTemplate}
            isLoading={isLoading}
          />
        </div>

        <div className="marketplace-footer">
          <button className="btn-close-modal" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default PromptMarketplace;

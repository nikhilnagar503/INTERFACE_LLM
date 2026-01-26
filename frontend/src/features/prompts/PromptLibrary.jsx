import React, { useState, useEffect } from 'react';
import PromptMarketplace from './PromptMarketplace';
import { databaseAPI } from '../../lib/databaseAPI';
import './PromptLibrary.css';

function PromptLibrary({ onUsePrompt, onPromptSelected, isModal = false, isOpen = true, onClose }) {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [newPrompt, setNewPrompt] = useState({
    title: '',
    description: '',
    content: '',
    tags: []
  });

  // Load user prompts from Supabase on mount
  useEffect(() => {
    loadUserPrompts();
  }, []);

  const loadUserPrompts = async () => {
    setLoading(true);
    try {
      const data = await databaseAPI.prompts.getUserPrompts();
      setPrompts(data || []);
    } catch (error) {
      console.error('Failed to load prompts:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('userPrompts');
      setPrompts(saved ? JSON.parse(saved) : []);
    } finally {
      setLoading(false);
    }
  };

  if (isModal && !isOpen) {
    return null;
  }

  // Filter prompts
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const isFavorite = selectedPrompt && favorites.includes(selectedPrompt.id);

  const toggleFavorite = () => {
    if (!selectedPrompt) return;
    setFavorites(prev => 
      prev.includes(selectedPrompt.id)
        ? prev.filter(id => id !== selectedPrompt.id)
        : [...prev, selectedPrompt.id]
    );
  };

  const handleAddPrompt = async () => {
    if (!newPrompt.title || !newPrompt.content) {
      alert('Please fill in title and content');
      return;
    }

    try {
      const prompt = {
        title: newPrompt.title,
        description: newPrompt.description,
        content: newPrompt.content,
        tags: newPrompt.tags.length > 0 ? newPrompt.tags : ['Custom'],
        is_public: false
      };
      
      const created = await databaseAPI.prompts.createPrompt(prompt);
      setPrompts([created, ...prompts]);
      setNewPrompt({ title: '', description: '', content: '', tags: [] });
      setShowAddModal(false);
      
      // Show notification
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (error) {
      console.error('Failed to create prompt:', error);
      alert('Failed to save prompt. Please try again.');
    }
  };

  const usePrompt = () => {
    if (!selectedPrompt) return;
    // Store in localStorage for chat component to use
    localStorage.setItem('selectedPrompt', JSON.stringify(selectedPrompt));
    if (onPromptSelected) {
      onPromptSelected(selectedPrompt);
    } else if (onUsePrompt) {
      onUsePrompt();
    } else {
      // Fallback to window.location.href if callback not provided
      window.location.href = '/';
    }
  };

  const handleMarketplaceSelect = async (template) => {
    // Add the selected template to user prompts (clone from system prompt)
    const exists = prompts.some(p => p.title === template.title);
    if (!exists) {
      try {
        const newPrompt = {
          title: template.title,
          description: template.description,
          content: template.content,
          tags: template.tags || [],
          is_public: false
        };
        const created = await databaseAPI.prompts.createPrompt(newPrompt);
        setPrompts([created, ...prompts]);
        
        // Show notification
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      } catch (error) {
        console.error('Failed to import prompt:', error);
        alert('Failed to import prompt. Please try again.');
      }
    }
    setSelectedPrompt(template);
    setShowMarketplace(false);
  };

  const copyToClipboard = () => {
    if (selectedPrompt) {
      navigator.clipboard.writeText(selectedPrompt.content);
      alert('Prompt copied to clipboard!');
    }
  };

  const libraryBody = (
    <div className={`prompt-library ${isModal ? 'prompt-library-modal' : ''}`}>
      {isModal && (
        <div className="prompt-library-modal-header">
          <div>
            <span className="modal-label">PROMPT HUB</span>
            <h2>Your Prompt Library</h2>
            <p>Create, browse, favorite, and send prompts straight into chat.</p>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
      )}
      {showNotification && (
        <div className="notification">
          ✓ Added to your prompt library
        </div>
      )}
      
      <div className="library-header">
        <div className="header-content">
          <h1>📚 Prompt Library</h1>
          <p>Save your frequently used prompts for quick access and reuse</p>
        </div>
        <div className="header-actions">
          <button className="btn-add" onClick={() => setShowAddModal(true)}>
            ➕ Add prompt
          </button>
          <button className="btn-browse" onClick={() => setShowMarketplace(true)}>
            📖 Browse prompts ({filteredPrompts.length})
          </button>
        </div>
      </div>

      <div className="library-container">
        {/* Sidebar */}
        <div className="library-sidebar">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="library-main">
          {prompts.length === 0 && searchTerm === '' && (
            <div className="empty-state">
              <h2>No prompts yet</h2>
              <p>Save your frequently used prompts for quick access and reuse</p>
              <div className="empty-actions">
                <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                  Create new prompt
                </button>
                <button className="btn-secondary" onClick={() => setShowMarketplace(true)}>
                  Browse prompts
                </button>
              </div>
              <div className="features-grid">
                <div className="feature">
                  <span className="icon">📋</span>
                  <span>Reusable Prompts</span>
                </div>
                <div className="feature">
                  <span className="icon">🔤</span>
                  <span>Variables Support</span>
                </div>
                <div className="feature">
                  <span className="icon">🏷️</span>
                  <span>Organize with Tags</span>
                </div>
                <div className="feature">
                  <span className="icon">⭐</span>
                  <span>Quick Favorites</span>
                </div>
              </div>
            </div>
          )}

          {filteredPrompts.length === 0 && searchTerm !== '' && (
            <div className="empty-state">
              <h2>No prompts found</h2>
              <p>Try adjusting your search or filters</p>
            </div>
          )}

          {filteredPrompts.length > 0 && !selectedPrompt && (
            <div className="prompts-grid">
              {filteredPrompts.map(prompt => (
                <div
                  key={prompt.id}
                  className={`prompt-card ${favorites.includes(prompt.id) ? 'favorite' : ''}`}
                  onClick={() => setSelectedPrompt(prompt)}
                >
                  <div className="card-header">
                    <h3>{prompt.title}</h3>
                    <button
                      className="favorite-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPrompt(prompt);
                        setFavorites(prev =>
                          prev.includes(prompt.id)
                            ? prev.filter(id => id !== prompt.id)
                            : [...prev, prompt.id]
                        );
                      }}
                    >
                      {favorites.includes(prompt.id) ? '⭐' : '☆'}
                    </button>
                  </div>
                  <p className="card-description">{prompt.description}</p>
                  <div className="card-tags">
                    {prompt.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedPrompt && (
            <div className="prompt-detail">
              <div className="detail-header">
                <button className="btn-back" onClick={() => setSelectedPrompt(null)}>
                  ← Back
                </button>
                <h2>{selectedPrompt.title}</h2>
                <button
                  className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                  onClick={toggleFavorite}
                >
                  {isFavorite ? '⭐' : '☆'}
                </button>
              </div>

              <p className="detail-description">{selectedPrompt.description}</p>

              <div className="detail-tags">
                {selectedPrompt.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>

              {selectedPrompt.variables && selectedPrompt.variables.length > 0 && (
                <div className="variables-section">
                  <h4>Variables:</h4>
                  <ul>
                    {selectedPrompt.variables.map((variable, idx) => (
                      <li key={idx}>{variable}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="prompt-content">
                <h4>Prompt:</h4>
                <div className="content-box">
                  <pre>{selectedPrompt.content}</pre>
                </div>
              </div>

              <div className="detail-actions">
                <button className="btn-primary" onClick={usePrompt}>
                  ✨ Use in Chat
                </button>
                <button className="btn-secondary" onClick={copyToClipboard}>
                  📋 Copy to Clipboard
                </button>
                <button className="btn-secondary" onClick={() => setShowPreview(!showPreview)}>
                  👁️ Preview
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Prompt Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create New Prompt</h2>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                placeholder="Enter prompt title"
                value={newPrompt.title}
                onChange={(e) => setNewPrompt({...newPrompt, title: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                placeholder="Brief description"
                value={newPrompt.description}
                onChange={(e) => setNewPrompt({...newPrompt, description: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Content</label>
              <textarea
                placeholder="Enter your prompt template"
                value={newPrompt.content}
                onChange={(e) => setNewPrompt({...newPrompt, content: e.target.value})}
                rows="8"
              />
            </div>
            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g., Content Creation, Marketing"
                onChange={(e) => setNewPrompt({...newPrompt, tags: e.target.value.split(',').map(t => t.trim())})}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleAddPrompt}>
                Create Prompt
              </button>
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Prompt Marketplace Modal */}
      <PromptMarketplace
        isOpen={showMarketplace}
        onClose={() => setShowMarketplace(false)}
        onSelectPrompt={handleMarketplaceSelect}
        selectedPrompts={[]}
      />
    </div>
  );

  if (isModal) {
    return (
      <div className="prompt-library-overlay">
        <div className="prompt-library-modal-wrapper">
          {libraryBody}
        </div>
      </div>
    );
  }

  return libraryBody;
}

export default PromptLibrary;

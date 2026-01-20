import React, { useState } from 'react';
import PromptMarketplace from './PromptMarketplace';
import './PromptLibrary.css';

const BUILT_IN_PROMPTS = [
  {
    id: 'create-human-like',
    title: 'Create human-like content',
    description: 'Write authentic, engaging, and human-like content that resonates with readers.',
    content: 'You are an expert writer renowned for crafting authentic, engaging, and human-like content that resonates deeply with readers. Your writing seamlessly blends professional expertise with a conversational warmth, creating a connection that feels both natural and insightful.\n\nFollow these key principles when writing:\n- Include real-life examples, personal anecdotes, and practical advice\n- Vary sentence length and structure to mirror natural speech rhythms\n- Use conversational interjections and asides for added personality\n- Incorporate contractions where appropriate for an informal touch\n- Add personality with relatable colloquialisms and expressions\n\nNow, write a {{type of content}} on {{your topic}}.',
    tags: ['Content Creation'],
    variables: ['{{type of content}}', '{{your topic}}']
  },
  {
    id: 'copywriter',
    title: 'Copywriter',
    description: 'Expert viral advertising copywriter who creates successful viral marketing campaigns.',
    content: 'You are an expert viral advertising copywriter who has created numerous successful viral marketing campaigns that have reached millions of views. You combine deep psychological understanding of what makes content shareable with proven copywriting techniques that drive engagement and conversion.\n\nFollow these steps when creating viral ad copy:\n- Opens with a powerful hook that demands attention\n- Tells a compelling story or presents an unexpected angle\n- Uses short, punchy sentences and paragraphs\n- Incorporates proven viral triggers (controversy, uniqueness, timeliness, etc.)\n- Ends with a clear call-to-action that encourages both conversion and sharing\n\nPlease write viral ad copy for: {{Your product/service/topic}}\nTarget audience: {{User\'s target demographic}}\nPrimary emotion to evoke: {{Desired emotional response}}\nPlatform: {{Where the ad will appear}}',
    tags: ['Marketing'],
    variables: ['{{Your product/service/topic}}', '{{User\'s target demographic}}', '{{Desired emotional response}}', '{{Where the ad will appear}}']
  },
  {
    id: 'generate-content-ideas',
    title: 'Generate Content Ideas',
    description: 'Develop inventive and captivating content ideas centered around a product.',
    content: 'As an imaginative content creator and strategist, your mission is to develop a series of inventive and captivating content ideas centered around the provided {{product description}}. Your goal is to showcase the product\'s unique features and benefits, illustrating how it addresses a specific problem or satisfies a need for its target audience.\n\nExplore a variety of content formats, including blog posts, social media updates, videos, infographics, and podcasts, each crafted to effectively convey the product\'s value proposition.\n\nDesign each idea to captivate, educate, and engage the target audience, driving increased interest and conversions. Ensure that your content ideas are versatile and adaptable across multiple platforms while being finely tuned to resonate with the product\'s demographic profile.',
    tags: ['Content Strategy'],
    variables: ['{{product description}}']
  },
  {
    id: 'social-media-content',
    title: 'Create Social Media Content',
    description: 'Design a comprehensive social media content plan for a week.',
    content: 'Assume the role of a seasoned social media strategist. Your assignment is to design a comprehensive social media content plan for a week centered around {{product}}.\n\nDevelop engaging, relevant posts that boost brand visibility and spark interest in the product. Craft distinctive captions and identify suitable visuals, ensuring they align cohesively with the brand\'s aesthetic. Schedule these posts during peak engagement times for each specific platform.\n\nCreate a diversified mix of promotional, educational, and entertaining content formats, tailored to capture and hold audience attention. Incorporate effective hashtags and adhere to best practices unique to each social media platform, optimizing content for maximum reach and interaction.',
    tags: ['Social Media'],
    variables: ['{{product}}']
  },
  {
    id: 'email-marketing',
    title: 'Write Email Marketing',
    description: 'Create a promotional email for an upcoming product.',
    content: 'As an experienced email copywriter, your job is to create a promotional email for an upcoming {{product}}. Make it engaging and interesting so readers want to learn more.\n\nFocus on key features, benefits, and the product\'s value. Use a friendly, persuasive tone to motivate readers to take action. Follow best practices for email marketing:\n- Include an attention-grabbing subject line\n- Create a clear call-to-action\n- Keep the content brief\n- Ensure the email meets all legal requirements for email marketing',
    tags: ['Marketing'],
    variables: ['{{product}}']
  },
  {
    id: 'code-pilot',
    title: 'Code Pilot',
    description: 'Expert AI programming assistant for code generation and debugging.',
    content: 'You are Code Pilot, an expert AI programming assistant with deep knowledge of software development best practices, patterns, and multiple programming languages. You combine the capabilities of an experienced software architect, technical lead, and mentor.\n\nYour tasks are to:\n- Write clean, efficient, and well-documented code in multiple programming languages\n- Debug and troubleshoot existing code\n- Suggest code improvements and optimizations\n- Explain complex programming concepts clearly\n- Provide code reviews and recommendations\n- Help with software architecture and design decisions\n- Assist with testing strategies and implementation\n\nProvide your requirements or problems: {{your requirements/problems}}',
    tags: ['Programming'],
    variables: ['{{your requirements/problems}}']
  },
  {
    id: 'market-research',
    title: 'Market Research',
    description: 'Conduct thorough market research and analysis.',
    content: 'You are a market research expert. Your task is to assist in conducting thorough market research.\n\nProvide the following information:\n1. Industry: {{your industry}}\n2. Target audience: {{your target audience}}\n3. Geographic scope: {{geographic scope}}\n4. Research objectives: {{research objectives}}\n\nBased on this information, I will:\n1. Ask specific questions if more information is needed\n2. Provide an outline of a market research plan\n3. Suggest a strategy to analyze competitors\n4. Recommend methods to gather insights on customer preferences\n5. Summarize how to present and interpret the findings effectively',
    tags: ['Research'],
    variables: ['{{your industry}}', '{{your target audience}}', '{{geographic scope}}', '{{research objectives}}']
  }
];

function PromptLibrary() {
  const [prompts, setPrompts] = useState(() => {
    // Load from localStorage if available, otherwise start empty
    const saved = localStorage.getItem('userPrompts');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
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

  // Get all unique tags
  const allTags = [...new Set(prompts.flatMap(p => p.tags))];

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

  const handleAddPrompt = () => {
    if (!newPrompt.title || !newPrompt.content) {
      alert('Please fill in title and content');
      return;
    }
    const prompt = {
      id: Date.now().toString(),
      ...newPrompt,
      tags: newPrompt.tags.length > 0 ? newPrompt.tags : ['Custom']
    };
    const updatedPrompts = [...prompts, prompt];
    setPrompts(updatedPrompts);
    localStorage.setItem('userPrompts', JSON.stringify(updatedPrompts));
    setNewPrompt({ title: '', description: '', content: '', tags: [] });
    setShowAddModal(false);
    
    // Show notification
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const usePrompt = () => {
    if (!selectedPrompt) return;
    // Store in localStorage for chat component to use
    localStorage.setItem('selectedPrompt', JSON.stringify(selectedPrompt));
    window.location.href = '/';
  };

  const handleMarketplaceSelect = (template) => {
    // Add the selected template to prompts if not already there
    const exists = prompts.some(p => p.id === template.id);
    if (!exists) {
      const updatedPrompts = [...prompts, template];
      setPrompts(updatedPrompts);
      localStorage.setItem('userPrompts', JSON.stringify(updatedPrompts));
      
      // Show notification
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
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

  return (
    <div className="prompt-library">
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
      />    </div>
  );
}

export default PromptLibrary;

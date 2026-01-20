import React, { useState, useEffect } from 'react';
import Sidebar from '../features/sidebar/Sidebar';
import ChatInterface from '../features/chat/ChatInterface';
import SettingsPage from '../features/settings/SettingsPage';
import PromptLibrary from '../features/prompts/PromptLibrary';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    // Check if a prompt was selected and stored in localStorage
    const selectedPrompt = localStorage.getItem('selectedPrompt');
    return selectedPrompt ? 'chat' : 'chat';
  });
  const [apiKeys, setApiKeys] = useState({
    openai: localStorage.getItem('api_key_openai') || '',
    anthropic: localStorage.getItem('api_key_anthropic') || '',
    gemini: localStorage.getItem('api_key_gemini') || '',
    groq: localStorage.getItem('api_key_groq') || '',
  });
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [promptFromLibrary, setPromptFromLibrary] = useState(null);

  // Check for selected prompt from library on mount and when currentPage changes
  useEffect(() => {
    const selectedPrompt = localStorage.getItem('selectedPrompt');
    if (selectedPrompt && currentPage === 'chat') {
      try {
        const promptData = JSON.parse(selectedPrompt);
        setPromptFromLibrary(promptData);
        // Clear the localStorage after reading it
        localStorage.removeItem('selectedPrompt');
      } catch (error) {
        console.error('Error parsing selected prompt:', error);
      }
    }
  }, [currentPage]);

  const handleSaveApiKeys = (keys) => {
    setApiKeys(keys);
    Object.keys(keys).forEach((provider) => {
      localStorage.setItem(`api_key_${provider}`, keys[provider]);
    });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'chat':
        return (
          <ChatInterface 
            selectedModel={selectedModel} 
            setSelectedModel={setSelectedModel} 
            apiKeys={apiKeys}
            initialPrompt={promptFromLibrary}
            onPromptUsed={() => setPromptFromLibrary(null)}
          />
        );
      case 'settings':
        return <SettingsPage apiKeys={apiKeys} onSaveApiKeys={handleSaveApiKeys} />;
      case 'prompts':
        return <PromptLibrary onUsePrompt={() => setCurrentPage('chat')} />;
      default:
        return (
          <ChatInterface 
            selectedModel={selectedModel} 
            setSelectedModel={setSelectedModel} 
            apiKeys={apiKeys}
            initialPrompt={promptFromLibrary}
            onPromptUsed={() => setPromptFromLibrary(null)}
          />
        );
    }
  };

  return (
    <div className="app">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="app-main">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;


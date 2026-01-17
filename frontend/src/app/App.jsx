import React, { useState } from 'react';
import Sidebar from '../features/sidebar/Sidebar';
import ChatInterface from '../features/chat/ChatInterface';
import SettingsPage from '../features/settings/SettingsPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('chat');
  const [apiKeys, setApiKeys] = useState({
    openai: localStorage.getItem('api_key_openai') || '',
    anthropic: localStorage.getItem('api_key_anthropic') || '',
    gemini: localStorage.getItem('api_key_gemini') || '',
    groq: localStorage.getItem('api_key_groq') || '',
  });
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');

  const handleSaveApiKeys = (keys) => {
    setApiKeys(keys);
    Object.keys(keys).forEach((provider) => {
      localStorage.setItem(`api_key_${provider}`, keys[provider]);
    });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'chat':
        return <ChatInterface selectedModel={selectedModel} setSelectedModel={setSelectedModel} apiKeys={apiKeys} />;
      case 'settings':
        return <SettingsPage apiKeys={apiKeys} onSaveApiKeys={handleSaveApiKeys} />;
      default:
        return <ChatInterface selectedModel={selectedModel} setSelectedModel={setSelectedModel} apiKeys={apiKeys} />;
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

import React, { useState, useEffect } from 'react';
import Sidebar from '../features/sidebar/Sidebar';
import SessionSidebar from '../features/chat/SessionSidebar';
import ChatInterface from '../features/chat/ChatInterface';
import SettingsPage from '../features/settings/SettingsPage';
import AuthPage from '../features/auth/AuthPage';
import ProfilePage from '../features/profile/ProfilePage';
import PromptLibrary from '../features/prompts/PromptLibrary';
import { supabase } from '../lib/supabaseClient';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('auth');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    gemini: '',
    groq: '',
  });
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [sessionSidebarExpanded, setSessionSidebarExpanded] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState(null);
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

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session) {
        loadUserApiKeys(data.session.user.id);
        setCurrentPage('chat');
      }
      setLoading(false);
    };

    loadSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        loadUserApiKeys(newSession.user.id);
        setCurrentPage('chat');
      } else {
        // Clear API keys on logout
        setApiKeys({
          openai: '',
          anthropic: '',
          gemini: '',
          groq: '',
        });
        setCurrentPage('auth');
      }
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  const loadUserApiKeys = (userId) => {
    const userKeys = {
      openai: localStorage.getItem(`api_key_openai_${userId}`) || '',
      anthropic: localStorage.getItem(`api_key_anthropic_${userId}`) || '',
      gemini: localStorage.getItem(`api_key_gemini_${userId}`) || '',
      groq: localStorage.getItem(`api_key_groq_${userId}`) || '',
    };
    setApiKeys(userKeys);
    
    // Check if user needs to configure API keys (new user)
    const hasAnyKey = Object.values(userKeys).some(key => key !== '');
    if (!hasAnyKey) {
      // New user - redirect to settings to configure API keys
      setTimeout(() => {
        setCurrentPage('settings');
      }, 500);
    }
  };

  const handleSaveApiKeys = (keys) => {
    setApiKeys(keys);
    if (session?.user?.id) {
      Object.keys(keys).forEach((provider) => {
        localStorage.setItem(`api_key_${provider}_${session.user.id}`, keys[provider]);
      });
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    // Will trigger a new session in ChatInterface
  };

  const handleSelectSession = (session) => {
    setCurrentSessionId(session.id);
    // Optionally load session data here
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentPage('auth');
  };

  const handleUpdateName = async (name) => {
    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: name },
    });
    if (!error && data?.user) {
      setSession((prev) => (prev ? { ...prev, user: data.user } : prev));
    }
    return { error };
  };

  const renderPage = () => {
    if (!session && currentPage !== 'auth') {
      return <AuthPage session={session} onAuthComplete={(s) => { setSession(s); setCurrentPage('chat'); }} />;
    }

    switch (currentPage) {
      case 'auth':
        return <AuthPage session={session} onAuthComplete={(s) => { setSession(s); setCurrentPage('chat'); }} />;
      case 'chat':
        return (
          <ChatInterface
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            apiKeys={apiKeys}
            session={session}
            sessionId={currentSessionId}
            initialPrompt={promptFromLibrary}
            onPromptUsed={() => setPromptFromLibrary(null)}
          />
        );
      case 'settings':
        return <SettingsPage apiKeys={apiKeys} onSaveApiKeys={handleSaveApiKeys} />;
      case 'profile':
        return <ProfilePage session={session} onSignOut={handleSignOut} onUpdateName={handleUpdateName} />;
      case 'prompts':
        return <PromptLibrary onUsePrompt={() => setCurrentPage('chat')} />;
      default:
        return (
          <ChatInterface
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            apiKeys={apiKeys}
            session={session}
            sessionId={currentSessionId}
            initialPrompt={promptFromLibrary}
            onPromptUsed={() => setPromptFromLibrary(null)}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      {session && (
        <Sidebar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          session={session} 
          onNewChat={handleNewChat}
          onExpandSessionSidebar={() => setSessionSidebarExpanded(true)}
        />
      )}
      {session && currentPage === 'chat' && (
        <SessionSidebar
          isExpanded={sessionSidebarExpanded}
          onToggle={() => setSessionSidebarExpanded(!sessionSidebarExpanded)}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          currentSessionId={currentSessionId}
        />
      )}
      <main className="app-main">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;


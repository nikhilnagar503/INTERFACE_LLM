import React, { useState, useEffect } from 'react';
import ChatSidebar from '../features/chat/ChatSidebar';
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
  const [loading, setLoading] = useState(true);  // flag to show “Loading…” while the app checks login status.
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    gemini: '',
    groq: '',
  });
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [promptFromLibrary, setPromptFromLibrary] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  const [sessionMessages, setSessionMessages] = useState({});

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
        refreshUserAvatar(data.session.user);
        setCurrentPage('chat');
      }
      const storedSessions = localStorage.getItem('chat_sessions');
      if (storedSessions) {
        try {
          const parsed = JSON.parse(storedSessions);
          if (Array.isArray(parsed)) {
            setChatSessions(parsed);
          }
        } catch (error) {
          console.error('Failed to parse chat sessions', error);
        }
      }
      const storedMessages = localStorage.getItem('chat_session_messages');
      if (storedMessages) {
        try {
          const parsedMessages = JSON.parse(storedMessages);
          if (parsedMessages && typeof parsedMessages === 'object') {
            setSessionMessages(parsedMessages);
          }
        } catch (error) {
          console.error('Failed to parse chat messages', error);
        }
      }
      setLoading(false);
    };

    loadSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        loadUserApiKeys(newSession.user.id);
        refreshUserAvatar(newSession.user);
        setCurrentPage('chat');
      } else {
        // Clear API keys on logout
        setApiKeys({
          openai: '',
          anthropic: '',
          gemini: '',
          groq: '',
        });
        setUserAvatar(null);
        setCurrentPage('auth');
      }
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  const updateSessions = (updater) => {
    setChatSessions((prev) => {
      const next = updater(prev);
      localStorage.setItem('chat_sessions', JSON.stringify(next));
      return next;
    });
  };

  const updateSessionMessages = (sessionId, messages) => {
    if (!sessionId) return;
    setSessionMessages((prev) => {
      const next = { ...prev, [sessionId]: messages };
      localStorage.setItem('chat_session_messages', JSON.stringify(next));
      return next;
    });
  };

  const loadUserApiKeys = (userId) => {
    const userKeys = {
      openai: localStorage.getItem(`api_key_openai_${userId}`) || '',
      anthropic: localStorage.getItem(`api_key_anthropic_${userId}`) || '',
      gemini: localStorage.getItem(`api_key_gemini_${userId}`) || '',
      groq: localStorage.getItem(`api_key_groq_${userId}`) || '',
    };
    setApiKeys(userKeys);
    // User stays on chat page - they can configure API keys via settings when needed
  };

  const refreshUserAvatar = (user) => {
    if (!user?.id) {
      setUserAvatar(null);
      return;
    }
    const stored = localStorage.getItem(`user_avatar_${user.id}`);
    if (stored) {
      setUserAvatar(stored);
      return;
    }
    const fallback = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
    setUserAvatar(fallback || null);
  };

  const handleUpdateAvatar = async (avatarDataUrl) => {
    if (!session?.user?.id) {
      return { error: 'No active session' };
    }
    if (avatarDataUrl) {
      localStorage.setItem(`user_avatar_${session.user.id}`, avatarDataUrl);
    } else {
      localStorage.removeItem(`user_avatar_${session.user.id}`);
    }
    setUserAvatar(avatarDataUrl || null);
    try {
      await supabase.auth.updateUser({
        data: { avatar_url: avatarDataUrl || null },
      });
    } catch (error) {
      console.error('Failed to sync avatar with Supabase', error);
    }
    return { success: true };
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
    const newSession = {
      id: `session-${Date.now()}`,
      title: 'New chat',
      timestamp: new Date().toISOString(),
    };
    updateSessions((prev) => {
      const next = [newSession, ...prev.filter((s) => s.id !== newSession.id)];
      return next.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });
    setCurrentSessionId(newSession.id);
    updateSessionMessages(newSession.id, []);
    setCurrentPage('chat');
  };

  const handleSelectSession = (session) => {
    setCurrentSessionId(session.id);
    // Optionally load session data here
  };

  const handleClearSessions = () => {
    localStorage.removeItem('chat_sessions');
    localStorage.removeItem('chat_session_messages');
    setChatSessions([]);
    setSessionMessages({});
    setCurrentSessionId(null);
  };

  const handleSessionUpdate = (sessionId, data) => {
    if (!sessionId) return;
    updateSessions((prev) => {
      const existingIndex = prev.findIndex((s) => s.id === sessionId);
      const now = data?.timestamp || new Date().toISOString();
      const title = data?.title || prev[existingIndex]?.title || 'New chat';
      const updated = {
        id: sessionId,
        title,
        timestamp: now,
      };
      const next = [...prev];
      if (existingIndex >= 0) {
        next[existingIndex] = { ...prev[existingIndex], ...updated };
      } else {
        next.unshift(updated);
      }
      return next.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });
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
            messages={currentSessionId ? (sessionMessages[currentSessionId] || []) : []}
            onMessagesChange={(messages) => updateSessionMessages(currentSessionId, messages)}
            onSessionUpdate={handleSessionUpdate}
            initialPrompt={promptFromLibrary}
            onPromptUsed={() => setPromptFromLibrary(null)}
            onOpenSettings={() => setCurrentPage('settings')}
            userAvatar={userAvatar}
          />
        );
      case 'settings':
        return <SettingsPage apiKeys={apiKeys} onSaveApiKeys={handleSaveApiKeys} onClose={() => setCurrentPage('chat')} />;
      case 'profile':
        return (
          <ProfilePage
            session={session}
            onSignOut={handleSignOut}
            onUpdateName={handleUpdateName}
            onUpdateAvatar={handleUpdateAvatar}
            userAvatar={userAvatar}
            onClose={() => setCurrentPage('chat')}
          />
        );
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
            messages={currentSessionId ? (sessionMessages[currentSessionId] || []) : []}
            onMessagesChange={(messages) => updateSessionMessages(currentSessionId, messages)}
            initialPrompt={promptFromLibrary}
            onPromptUsed={() => setPromptFromLibrary(null)}
            userAvatar={userAvatar}
            onOpenSettings={() => setCurrentPage('settings')}
            onSessionUpdate={handleSessionUpdate}
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
        <ChatSidebar
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          currentSessionId={currentSessionId}
          sessions={chatSessions}
          onClearSessions={handleClearSessions}
          onOpenSettings={() => setCurrentPage('settings')}
          onOpenProfile={() => setCurrentPage('profile')}
          session={session}
          userAvatar={userAvatar}
        />
      )}
      <main className={`app-main ${session ? 'with-sidebar' : ''}`}>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;


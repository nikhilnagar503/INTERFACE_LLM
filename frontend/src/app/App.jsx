
// Import React and hooks for state and lifecycle management
import React, { useState, useEffect } from 'react';
// Import UI components for different app features
import ChatSidebar from '../features/chat/ChatSidebar';
import ChatInterface from '../features/chat/ChatInterface';
import SettingsPage from '../features/settings/SettingsPage';
import AuthPage from '../features/auth/AuthPage';
import ProfilePage from '../features/profile/ProfilePage';
import PromptLibrary from '../features/prompts/PromptLibrary';
// Supabase client for authentication and user management
import { supabase } from '../lib/supabaseClient';
import { databaseAPI } from '../lib/databaseAPI';
import './App.css';


function App() {
  // Track which page is currently displayed (auth, chat, settings, etc.)
  const [currentPage, setCurrentPage] = useState('auth');   
  // Store the current user session (null if not logged in)
  const [session, setSession] = useState(null);
  // Show loading spinner while checking login status
  const [loading, setLoading] = useState(true);
  // Store API keys for different LLM providers (per user)
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    gemini: '',
    groq: '',
  });
  // Track which LLM model is selected for chat
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  // Track the currently active chat session ID
  const [currentSessionId, setCurrentSessionId] = useState(null);
  // Store a prompt selected from the prompt library (if any)
  const [promptFromLibrary, setPromptFromLibrary] = useState(null);
  // Store the user's avatar (profile picture)
  const [userAvatar, setUserAvatar] = useState(null);
  // List of all chat sessions for the user
  const [chatSessions, setChatSessions] = useState([]);
  // Store messages for each chat session (by sessionId)
  const [sessionMessages, setSessionMessages] = useState({});

  // On mount or when the page changes, check if a prompt was selected from the library
  useEffect(() => {
    const selectedPrompt = localStorage.getItem('selectedPrompt');
    if (selectedPrompt && currentPage === 'chat') {
      try {
        // Parse and set the selected prompt, then clear it from storage
        const promptData = JSON.parse(selectedPrompt);
        setPromptFromLibrary(promptData);
        localStorage.removeItem('selectedPrompt');
      } catch (error) {
        console.error('Error parsing selected prompt:', error);
      }
    }
  }, [currentPage]);

  // On mount, check for an existing user session and load user/chat data from localStorage
  useEffect(() => {
    const loadSession = async () => {
      // Get the current session from Supabase
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session) {
        // If logged in, load API keys and avatar, go to chat page
        loadUserApiKeys(data.session.user.id);
        refreshUserAvatar(data.session.user);
        
        // Create user profile if it doesn't exist (for new users)
        try {
          await databaseAPI.auth?.createProfile?.({
            display_name: data.session.user.email?.split('@')[0] || 'User',
            avatar_url: null
          }).catch(() => {
            // Profile may already exist, that's fine
          });
        } catch (err) {
          console.warn('Could not ensure profile exists:', err);
        }
        
        setCurrentPage('chat');
      }
      // Load chat sessions from Supabase
      if (data.session) {
        try {
          const sessions = await databaseAPI.sessions.getSessions();
          setChatSessions(sessions || []);
          // Load messages for each session
          const messagesMap = {};
          for (const sess of sessions || []) {
            const msgs = await databaseAPI.messages.getMessages(sess.id);
            messagesMap[sess.id] = msgs || [];
          }
          setSessionMessages(messagesMap);
        } catch (error) {
          console.error('Failed to load sessions/messages from Supabase:', error);
          // Fallback to localStorage
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
        }
      }
      setLoading(false); // Hide loading spinner
    };

    loadSession();
    // Listen for auth state changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        // On login, load user data and go to chat
        loadUserApiKeys(newSession.user.id);
        refreshUserAvatar(newSession.user);
        setCurrentPage('chat');
      } else {
        // On logout, clear API keys and avatar, go to auth page
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

    // Cleanup listener on unmount
    return () => listener?.subscription?.unsubscribe();
  }, []);

  // When user logs in and enters chat, ensure a session is selected or create a new one
  useEffect(() => {
    if (!session || currentPage !== 'chat' || currentSessionId) return;
    if (chatSessions.length > 0) {
      setCurrentSessionId(chatSessions[0].id);
      return;
    }

    // If no sessions exist, create a new chat session in Supabase
    const createInitialSession = async () => {
      try {
        const created = await databaseAPI.sessions.createSession('New chat');
        const newSession = {
          id: created.id,
          title: created.title,
          timestamp: created.created_at,
        };
        updateSessions((prev) => {
          const next = [newSession, ...prev.filter((s) => s.id !== newSession.id)];
          return next.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        });
        setCurrentSessionId(newSession.id);
        updateSessionMessages(newSession.id, []);
      } catch (error) {
        console.error('Failed to create initial session:', error);
        // Fallback to local session
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
      }
    };
    createInitialSession();
  }, [session, currentPage, currentSessionId, chatSessions]);

  // Update the list of chat sessions and persist to Supabase
  const updateSessions = (updater) => {
    setChatSessions((prev) => {
      const next = updater(prev);
      // Keep a copy in localStorage as cache
      localStorage.setItem('chat_sessions', JSON.stringify(next));
      return next;
    });
  };

  // Update the messages for a given session and persist to Supabase
  const updateSessionMessages = (sessionId, messages) => {
    if (!sessionId) return;
    setSessionMessages((prev) => {
      const next = { ...prev, [sessionId]: messages };
      // Keep a copy in localStorage as cache
      localStorage.setItem('chat_session_messages', JSON.stringify(next));
      return next;
    });
  };

  // Load API keys for the current user from localStorage
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

  // Load the user's avatar from localStorage or fallback to metadata
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
    // Use avatar_url or picture from user metadata as fallback
    const fallback = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
    setUserAvatar(fallback || null);
  };

  // Update the user's avatar (profile picture) and sync with Supabase
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

  // Save API keys for the user to localStorage
  const handleSaveApiKeys = (keys) => {
    setApiKeys(keys);
    if (session?.user?.id) {
      Object.keys(keys).forEach((provider) => {
        localStorage.setItem(`api_key_${provider}_${session.user.id}`, keys[provider]);
      });
    }
  };

  // Create a new chat session and switch to it
  const handleNewChat = async () => {
    try {
      const created = await databaseAPI.sessions.createSession('New chat');
      const newSession = {
        id: created.id,
        title: created.title,
        timestamp: created.created_at,
      };
      updateSessions((prev) => {
        const next = [newSession, ...prev.filter((s) => s.id !== newSession.id)];
        return next.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      });
      setCurrentSessionId(newSession.id);
      updateSessionMessages(newSession.id, []);
      setCurrentPage('chat');
    } catch (error) {
      console.error('Failed to create session:', error);
      // Fallback to local session
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
    }
  };

  // Select an existing chat session
  const handleSelectSession = (session) => {
    setCurrentSessionId(session.id);
    // Optionally load session data here
  };

  // Clear all chat sessions and messages (backend + cache)
  const handleClearSessions = async () => {
    try {
      const sessions = await databaseAPI.sessions.getSessions();
      await Promise.all((sessions || []).map((s) => databaseAPI.sessions.deleteSession(s.id)));
    } catch (err) {
      console.error('Failed to clear sessions in backend:', err);
    } finally {
      localStorage.removeItem('chat_sessions');
      localStorage.removeItem('chat_session_messages');
      setChatSessions([]);
      setSessionMessages({});
      setCurrentSessionId(null);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!sessionId) return;
    try {
      await databaseAPI.sessions.deleteSession(sessionId);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }

    updateSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setSessionMessages((prev) => {
      const next = { ...prev };
      delete next[sessionId];
      localStorage.setItem('chat_session_messages', JSON.stringify(next));
      return next;
    });

    if (currentSessionId === sessionId) {
      const remaining = chatSessions.filter((s) => s.id !== sessionId);
      const nextSession = remaining[0]?.id || null;
      setCurrentSessionId(nextSession);
    }
  };

  // Update a chat session's metadata (title, timestamp)
  const handleSessionUpdate = async (sessionId, data) => {
    if (!sessionId) return;
    // Persist title/model to backend
    if (data?.title || data?.modelUsed) {
      try {
        await databaseAPI.sessions.updateSession(sessionId, {
          title: data.title,
          modelUsed: data.modelUsed,
        });
      } catch (err) {
        console.error('Failed to update session title/model:', err);
      }
    }
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

  // Sign out the user and return to auth page
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentPage('auth');
  };

  // Update the user's display name in Supabase
  const handleUpdateName = async (name) => {
    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: name },
    });
    if (!error && data?.user) {
      setSession((prev) => (prev ? { ...prev, user: data.user } : prev));
    }
    return { error };
  };

  // Render the appropriate page/component based on the current state
  const renderPage = () => {
    // If not logged in, always show the AuthPage
    if (!session && currentPage !== 'auth') {
      return <AuthPage session={session} onAuthComplete={(s) => { setSession(s); setCurrentPage('chat'); }} />;
    }

    switch (currentPage) {
      case 'auth':
        // Show login/signup page
        return <AuthPage session={session} onAuthComplete={(s) => { setSession(s); setCurrentPage('chat'); }} />;
      case 'chat':
        // Main chat interface
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
        // Settings page for API keys
        return <SettingsPage apiKeys={apiKeys} onSaveApiKeys={handleSaveApiKeys} onClose={() => setCurrentPage('chat')} />;
      case 'profile':
        // User profile page
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
        // Prompt library page
        return <PromptLibrary onUsePrompt={() => setCurrentPage('chat')} />;
      default:
        // Fallback to chat interface
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

  // Show a loading spinner while the app is initializing
  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Main app layout: sidebar (if logged in) and main content area
  return (
    <div className="app">
      {/* Show sidebar only if user is logged in */}
      {session && (
        <ChatSidebar
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          currentSessionId={currentSessionId}
          sessions={chatSessions}
          onClearSessions={handleClearSessions}
          onDeleteSession={handleDeleteSession}
          onOpenSettings={() => setCurrentPage('settings')}
          onOpenProfile={() => setCurrentPage('profile')}
          session={session}
          userAvatar={userAvatar}
        />
      )}
      {/* Main content area for the selected page */}
      <main className={`app-main ${session ? 'with-sidebar' : ''}`}>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;


import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import './AuthPage.css';

function AuthPage({ session, onAuthComplete }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    setMessage('');
  }, [mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'signin') {
        const { error: signInError, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          if (signInError.message.includes('Email not confirmed')) {
            throw new Error('Please check your email and click the confirmation link to verify your account.');
          }
          throw signInError;
        }
        setMessage('Signed in successfully. Redirecting to chat...');
        onAuthComplete?.(data.session);
      } else {
        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        
        // Check if email confirmation is required
        if (data.user && !data.session) {
          setMessage('Sign-up successful! Please check your email and click the confirmation link to verify your account.');
        } else if (data.session) {
          setMessage('Sign-up successful! Redirecting to chat...');
          onAuthComplete?.(data.session);
        } else {
          setMessage('Sign-up successful.');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { error: magicError } = await supabase.auth.signInWithOtp({ email });
      if (magicError) throw magicError;
      setMessage('Magic link sent. Check your email.');
    } catch (err) {
      setError(err.message || 'Unable to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onAuthComplete?.(null);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🔐</div>
          <div>
            <p className="auth-title">Account</p>
            <p className="auth-subtitle">Supabase-backed authentication</p>
          </div>
        </div>

        {session ? (
          <div className="auth-session">
            <p className="auth-success">Signed in as {session.user?.email}</p>
            <div className="auth-actions">
              <button type="button" className="auth-btn primary" onClick={() => onAuthComplete?.(session)}>
                Go to Chat
              </button>
              <button type="button" className="auth-btn" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-toggle">
              <button
                type="button"
                className={`auth-toggle-btn ${mode === 'signin' ? 'active' : ''}`}
                onClick={() => setMode('signin')}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`auth-toggle-btn ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => setMode('signup')}
              >
                Sign up
              </button>
            </div>

            <label className="auth-label">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="auth-label">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </label>

            <button type="submit" className="auth-btn primary" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>

            <button type="button" className="auth-btn" onClick={handleMagicLink} disabled={loading || !email}>
              Send magic link
            </button>

            {error && <p className="auth-error">{error}</p>}
            {message && <p className="auth-message">{message}</p>}
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthPage;

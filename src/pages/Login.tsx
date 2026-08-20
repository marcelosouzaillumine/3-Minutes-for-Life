import React, { useState } from 'react';
import { authService } from '../services/authService';
import { useTranslation } from 'react-i18next';
import './Auth.css';

export const Login: React.FC = () => {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const redirectTo = searchParams.get('redirectTo') || '/app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.signIn(email, password);
      window.location.href = redirectTo;
    } catch (err: any) {
      console.error(err);
      setError(t('login.errorIncorrect'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      await authService.signInWithOAuth('google', redirectTo);
    } catch (err: any) {
      console.error(err);
      setError(t('login.errorGoogle'));
      setLoading(false);
    }
    // Note: on success, Supabase redirects the browser — setLoading(false) is intentionally omitted.
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <button className="auth-back-btn" onClick={() => window.location.href = '/'} aria-label="Voltar">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <img src="/logo.png" alt="3 Minutes for Life" className="auth-logo" />
        <h1 className="auth-title">{t('login.title')}</h1>
        <p className="auth-subtitle">{t('login.subtitle')}</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder={t('login.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
          />
          <input
            type="password"
            placeholder={t('login.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="auth-input"
          />
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? t('login.buttonLoading') : t('login.button')}
          </button>
        </form>

        <div className="auth-divider">{t('login.divider')}</div>

        <button
          type="button"
          className="social-button"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg className="social-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t('login.googleButton')}
        </button>

        <div className="auth-footer">
          {t('login.noAccount')} <a href={`/signup${window.location.search}`}>{t('login.signupLink')}</a>
        </div>
      </div>
    </div>
  );
};

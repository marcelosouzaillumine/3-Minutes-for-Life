import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { authService } from '../services/authService';
import { useTranslation } from 'react-i18next';
import { BrandLogo } from '../components/BrandLogo';
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
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response: { credential?: string }) => {
    if (!response.credential) { setError(t('login.errorGoogle')); return; }
    setLoading(true);
    try {
      await authService.signInWithOAuth('google', response.credential);
      window.location.href = redirectTo;
    } catch (err: any) {
      console.error(err);
      setError(t('login.errorGoogle'));
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <button className="auth-back-btn" onClick={() => window.location.href = '/'} aria-label="Voltar">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <BrandLogo variant="light" className="auth-logo" />
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

        <div className="social-button-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError(t('login.errorGoogle'))}
            width="100%"
            text="signin_with"
            shape="rectangular"
          />
        </div>

        <div className="auth-footer">
          {t('login.noAccount')} <a href={`/signup${window.location.search}`}>{t('login.signupLink')}</a>
        </div>
      </div>
    </div>
  );
};

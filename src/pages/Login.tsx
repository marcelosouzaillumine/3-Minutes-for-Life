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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const searchParams = new URLSearchParams(window.location.search);
    const redirectTo = searchParams.get('redirectTo') || '/app';
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

  return (
    <div className="auth-container">
      <div className="auth-box">
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
        
        <div className="auth-footer">
          {t('login.noAccount')} <a href={`/signup${window.location.search}`}>{t('login.signupLink')}</a>
        </div>
      </div>
    </div>
  );
};

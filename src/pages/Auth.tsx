import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { authService } from '../services/authService';
import { AnalyticsService } from '../services/AnalyticsService';
import { LocationService } from '../services/LocationService';
import type { State, City } from '../services/LocationService';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { BrandLogo } from '../components/BrandLogo';
import './Auth.css';

type Step = 'email' | 'password' | 'register' | 'reset' | 'reset-sent';

export const Auth: React.FC = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirectTo') || (location.state as any)?.from?.pathname || '/app';

  // ─── step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('email');
  const [userInfo, setUserInfo] = useState<{ name?: string; avatar?: string } | null>(null);

  // ─── form fields ─────────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptsUpdates, setAcceptsUpdates] = useState(false);
  const [isForeign, setIsForeign] = useState(false);
  const [country, setCountry] = useState('Brasil');
  const [stateVal, setStateVal] = useState('');
  const [city, setCity] = useState('');
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // ─── ui state ────────────────────────────────────────────────────────────────
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Pré-carregar estados BR ao chegar no step register
  useEffect(() => {
    if (step !== 'register') return;
    setLoadingLocation(true);
    LocationService.getCountries().then(countries => {
      const brasil = countries.find((c: any) => c.name === 'Brasil' || c.code === 'BR');
      if (brasil) {
        LocationService.getStates(brasil.id).then(data => {
          setStates(data);
        }).catch(console.error);
      }
    }).catch(console.error).finally(() => setLoadingLocation(false));
  }, [step]);

  useEffect(() => {
    if (step === 'password') passwordRef.current?.focus();
  }, [step]);

  // ─── handlers ────────────────────────────────────────────────────────────────

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authService.checkEmail(email.trim().toLowerCase());
      if (result.exists) {
        setUserInfo({ name: result.name, avatar: result.avatar });
        setStep('password');
      } else {
        setStep('register');
      }
    } catch {
      // Se lookup falhar completamente, vai para login (mais provável)
      setStep('password');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.signIn(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(t('login.errorIncorrect'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.signUp(
        email, password, fullName, phone, country, stateVal, city, acceptsUpdates
      );
      const user = data.user;
      if (user) {
        const referralContext = AnalyticsService.getReferralContext();
        if (referralContext) {
          try {
            await supabase.rpc('attribute_referral', {
              p_user_id: user.id,
              p_referral_code: referralContext.code,
            });
            await AnalyticsService.trackEvent('referral_signup', {
              code: referralContext.code,
              devotional_id: referralContext.devotional_id,
              new_user_id: user.id,
            });
          } catch (e) {
            console.error('Error attributing referral', e);
          } finally {
            AnalyticsService.clearReferralContext();
          }
        }
      }
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('already registered') || err.message?.includes('EMAIL_TAKEN')) {
        setError(t('signup.errorEmailExists'));
        setStep('password');
      } else {
        setError(`${t('signup.errorCreate')}${err?.message || String(err)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.resetPassword(email);
      setStep('reset-sent');
    } catch (err: any) {
      console.error(err);
      setError('Não foi possível enviar o link. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response: { credential?: string }) => {
    if (!response.credential) { setError(t('login.errorGoogle')); return; }
    setLoading(true);
    try {
      await authService.signInWithOAuth('google', response.credential);
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(t('login.errorGoogle'));
    } finally {
      setLoading(false);
    }
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setStateVal(name);
    setCity('');
    const selected = states.find(s => s.name === name);
    if (selected) LocationService.getCities(selected.id).then(setCities).catch(console.error);
    else setCities([]);
  };

  const back = () => {
    setError('');
    setPassword('');
    if (step === 'reset' || step === 'reset-sent') {
      setStep('password');
    } else {
      setStep('email');
      setUserInfo(null);
    }
  };

  // ─── render helpers ───────────────────────────────────────────────────────────

  const renderEmailStep = () => (
    <>
      <h1 className="auth-title">Entrar ou criar conta</h1>
      <p className="auth-subtitle">Use seu e-mail para continuar</p>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleEmailSubmit} className="auth-form">
        <input
          type="email"
          placeholder={t('login.emailPlaceholder')}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
          className="auth-input"
        />
        <button type="submit" disabled={loading} className="auth-button">
          {loading ? 'Verificando...' : 'Continuar'}
        </button>
      </form>

      <div className="auth-divider">{t('login.divider')}</div>
      <div className="social-button-wrapper">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError(t('login.errorGoogle'))}
          width={340}
          text="continue_with"
          shape="rectangular"
        />
      </div>
    </>
  );

  const renderPasswordStep = () => (
    <>
      {userInfo?.avatar && (
        <img src={userInfo.avatar} alt="" className="auth-avatar" />
      )}
      <h1 className="auth-title">{userInfo?.name ? `Olá, ${userInfo.name.split(' ')[0]}` : t('login.title')}</h1>
      <p className="auth-subtitle auth-email-badge">{email}</p>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handlePasswordSubmit} className="auth-form">
        <input
          ref={passwordRef}
          type="password"
          placeholder={t('login.passwordPlaceholder')}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="auth-input"
        />
        <button type="submit" disabled={loading} className="auth-button">
          {loading ? t('login.buttonLoading') : t('login.button')}
        </button>
      </form>

      <button
        type="button"
        className="auth-link-btn"
        onClick={() => { setError(''); setStep('reset'); }}
      >
        Esqueci minha senha
      </button>

      <div className="auth-divider">{t('login.divider')}</div>
      <div className="social-button-wrapper">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError(t('login.errorGoogle'))}
          width={340}
          text="signin_with"
          shape="rectangular"
        />
      </div>
    </>
  );

  const renderRegisterStep = () => (
    <>
      <h1 className="auth-title">{t('signup.title')}</h1>
      <p className="auth-subtitle auth-email-badge">{email}</p>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleRegisterSubmit} className="auth-form">
        <input
          type="text"
          placeholder={t('signup.fullNamePlaceholder')}
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          required
          autoFocus
          className="auth-input"
        />
        <input
          type="tel"
          placeholder={t('signup.phonePlaceholder')}
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="auth-input"
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.25rem' }}>
          <input
            type="checkbox"
            id="foreign"
            checked={isForeign}
            onChange={e => {
              setIsForeign(e.target.checked);
              setCountry(e.target.checked ? '' : 'Brasil');
              setStateVal('');
              setCity('');
            }}
          />
          <label htmlFor="foreign" style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
            {t('signup.foreignCheckbox')}
          </label>
        </div>

        {!isForeign ? (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select
              value={stateVal}
              onChange={handleStateChange}
              className="auth-input"
              style={{ flex: 1, marginBottom: 0 }}
              required
              disabled={loadingLocation}
            >
              <option value="">{t('signup.statePlaceholder')}</option>
              {states.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="auth-input"
              style={{ flex: 2, marginBottom: 0 }}
              required
              disabled={!stateVal}
            >
              <option value="">{t('signup.cityPlaceholder')}</option>
              {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder={t('signup.countryPlaceholder')}
              value={country}
              onChange={e => setCountry(e.target.value)}
              required
              className="auth-input"
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input
                type="text"
                placeholder={t('signup.foreignStatePlaceholder')}
                value={stateVal}
                onChange={e => setStateVal(e.target.value)}
                className="auth-input"
              />
              <input
                type="text"
                placeholder={t('signup.cityPlaceholder')}
                value={city}
                onChange={e => setCity(e.target.value)}
                className="auth-input"
              />
            </div>
          </>
        )}

        <input
          type="password"
          placeholder={t('signup.passwordPlaceholder')}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
          className="auth-input"
        />

        <label className="signup-consent">
          <input
            type="checkbox"
            checked={acceptsUpdates}
            onChange={e => setAcceptsUpdates(e.target.checked)}
          />
          <span>{t('signup.consentUpdates')}</span>
        </label>

        <button type="submit" disabled={loading} className="auth-button">
          {loading ? t('signup.buttonLoading') : t('signup.button')}
        </button>
      </form>

      <div className="auth-divider">{t('signup.divider')}</div>
      <div className="social-button-wrapper">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError(t('signup.errorGoogle'))}
          width={340}
          text="signup_with"
          shape="rectangular"
        />
      </div>
    </>
  );

  const renderResetStep = () => (
    <>
      <h1 className="auth-title">Recuperar senha</h1>
      <p className="auth-subtitle">Enviaremos um link para você redefinir sua senha.</p>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleResetSubmit} className="auth-form">
        <input
          type="email"
          placeholder={t('login.emailPlaceholder')}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="auth-input"
        />
        <button type="submit" disabled={loading} className="auth-button">
          {loading ? 'Enviando...' : 'Enviar link de recuperação'}
        </button>
      </form>
    </>
  );

  const renderResetSent = () => (
    <>
      <div className="auth-success-icon">✉️</div>
      <h1 className="auth-title">Link enviado</h1>
      <p className="auth-subtitle">
        Enviamos um link de recuperação para <strong>{email}</strong>. Verifique sua caixa de entrada.
      </p>
      <button
        type="button"
        className="auth-button"
        style={{ marginTop: '1.5rem' }}
        onClick={() => setStep('password')}
      >
        Voltar ao login
      </button>
    </>
  );

  const showBack = step !== 'email';

  return (
    <div className="auth-container">
      <div className="auth-box">
        {showBack && (
          <button className="auth-back-btn" onClick={back} aria-label="Voltar">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {!showBack && (
          <button className="auth-back-btn" onClick={() => navigate('/')} aria-label="Voltar">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <BrandLogo variant="light" className="auth-logo" />

        {step === 'email' && renderEmailStep()}
        {step === 'password' && renderPasswordStep()}
        {step === 'register' && renderRegisterStep()}
        {step === 'reset' && renderResetStep()}
        {step === 'reset-sent' && renderResetSent()}
      </div>
    </div>
  );
};

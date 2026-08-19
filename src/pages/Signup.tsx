import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { AnalyticsService } from '../services/AnalyticsService';
import { LocationService } from '../services/LocationService';
import type { State, City } from '../services/LocationService';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import './Auth.css';

export const Signup: React.FC = () => {
  const { t } = useTranslation('auth');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // Location States
  const [isForeign, setIsForeign] = useState(false);
  const [country, setCountry] = useState('Brasil');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  
  // Data States
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(true);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Carrega os estados do Brasil ao montar
    LocationService.getCountries().then(countries => {
      const brasil = countries.find(c => c.name === 'Brasil' || c.code === 'BR');
      if (brasil) {
        LocationService.getStates(brasil.id).then(data => {
          setStates(data);
          setLoadingLocation(false);
        }).catch(() => setLoadingLocation(false));
      } else {
        setLoadingLocation(false);
      }
    }).catch(() => setLoadingLocation(false));
  }, []);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateName = e.target.value;
    setState(stateName);
    setCity('');
    
    const selectedState = states.find(s => s.name === stateName);
    if (selectedState) {
      LocationService.getCities(selectedState.id).then(setCities).catch(console.error);
    } else {
      setCities([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = new URLSearchParams(window.location.search);
    const redirectTo = searchParams.get('redirectTo') || '/app';
    setError('');
    setLoading(true);
    try {
      const data = await authService.signUp(email, password, fullName, phone, country, state, city);
      const user = data.user;
      
      if (user) {
        const referralContext = AnalyticsService.getReferralContext();
        if (referralContext) {
          try {
            await supabase.rpc('attribute_referral', { 
              p_user_id: user.id, 
              p_referral_code: referralContext.code 
            });
            await AnalyticsService.trackEvent('referral_signup', {
              code: referralContext.code,
              devotional_id: referralContext.devotional_id,
              new_user_id: user.id
            });
          } catch (e) {
            console.error('Error attributing referral', e);
          } finally {
            AnalyticsService.clearReferralContext();
          }
        }
      }
      
      window.location.href = redirectTo;
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('already registered')) {
        setError(t('signup.errorEmailExists'));
      } else {
        setError(`${t('signup.errorCreate')}${err?.message || JSON.stringify(err) || String(err)}`);
      }
    } finally {
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
        <img src="/logo.png" alt="3 Minutes for Life" className="auth-logo" />
        <h1 className="auth-title">{t('signup.title')}</h1>
        <p className="auth-subtitle">{t('signup.subtitle')}</p>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            type="text" 
            placeholder={t('signup.fullNamePlaceholder')} 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="auth-input"
          />
          <input 
            type="email" 
            placeholder={t('signup.emailPlaceholder')} 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
          />
          <input 
            type="tel" 
            placeholder={t('signup.phonePlaceholder')} 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="auth-input"
          />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', marginTop: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="foreign" 
              checked={isForeign} 
              onChange={(e) => {
                setIsForeign(e.target.checked);
                setCountry(e.target.checked ? '' : 'Brasil');
                setState('');
                setCity('');
              }} 
            />
            <label htmlFor="foreign" style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>{t('signup.foreignCheckbox')}</label>
          </div>

          {!isForeign ? (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <select 
                value={state} 
                onChange={handleStateChange} 
                className="auth-input" 
                style={{ flex: 1, marginBottom: 0 }}
                required
                disabled={loadingLocation}
              >
                <option value="">{t('signup.statePlaceholder')}</option>
                {states.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
              
              <select 
                value={city} 
                onChange={(e) => setCity(e.target.value)} 
                className="auth-input" 
                style={{ flex: 2, marginBottom: 0 }}
                required
                disabled={!state}
              >
                <option value="">{t('signup.cityPlaceholder')}</option>
                {cities.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <input 
                type="text" 
                placeholder={t('signup.countryPlaceholder')} 
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className="auth-input"
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="text" 
                  placeholder={t('signup.foreignStatePlaceholder')} 
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="auth-input"
                />
                <input 
                  type="text" 
                  placeholder={t('signup.cityPlaceholder')} 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="auth-input"
                />
              </div>
            </>
          )}

          <input 
            type="password" 
            placeholder={t('signup.passwordPlaceholder')} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="auth-input"
          />
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? t('signup.buttonLoading') : t('signup.button')}
          </button>
        </form>
        
        <div className="auth-footer">
          {t('signup.haveAccount')} <a href={`/login${window.location.search}`}>{t('signup.loginLink')}</a>
        </div>
      </div>
    </div>
  );
};

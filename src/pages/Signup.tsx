import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { AnalyticsService } from '../services/AnalyticsService';
import { LocationService } from '../services/LocationService';
import type { State, City } from '../services/LocationService';
import { supabase } from '../lib/supabase';
import './Auth.css';

export const Signup: React.FC = () => {
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
      
      window.location.href = '/app';
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('already registered')) {
        setError('Este e-mail já está cadastrado. Tente entrar na sua conta.');
      } else {
        setError(`FALHA_CRIAR_CONTA: ${err?.message || JSON.stringify(err) || String(err)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">Criar conta</h1>
        <p className="auth-subtitle">Comece gratuitamente sua jornada.</p>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            type="text" 
            placeholder="Nome completo" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="auth-input"
          />
          <input 
            type="email" 
            placeholder="E-mail" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
          />
          <input 
            type="tel" 
            placeholder="Telefone (opcional)" 
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
            <label htmlFor="foreign" style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>Moro fora do Brasil</label>
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
                <option value="">Estado</option>
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
                <option value="">Cidade</option>
                {cities.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <input 
                type="text" 
                placeholder="País" 
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className="auth-input"
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="text" 
                  placeholder="Estado/Província" 
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="auth-input"
                />
                <input 
                  type="text" 
                  placeholder="Cidade" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="auth-input"
                />
              </div>
            </>
          )}

          <input 
            type="password" 
            placeholder="Senha (mínimo 6 caracteres)" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="auth-input"
          />
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>
        
        <div className="auth-footer">
          Já tem uma conta? <a href="/login">Entrar</a>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { authService } from '../services/authService';
import './Auth.css';

export const Signup: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.signUp(email, password, fullName);
      window.location.href = '/app';
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('already registered')) {
        setError('Este e-mail já está cadastrado. Tente entrar na sua conta.');
      } else {
        setError('Ocorreu um erro ao criar sua conta. Tente novamente.');
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

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import './Auth.css';

const ILLUMINE_URL = import.meta.env.VITE_ILLUMINE_URL as string

async function confirmReset(token: string, newPassword: string): Promise<void> {
  const res = await fetch(`${ILLUMINE_URL}/auth/reset-password/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || 'RESET_FAILED');
  }
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) navigate('/login', { replace: true });
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      await confirmReset(token, password);
      setDone(true);
    } catch (err: any) {
      if (err.message === 'INVALID_RESET_TOKEN') {
        setError('Link inválido ou expirado. Solicite um novo link de recuperação.');
      } else {
        setError('Não foi possível redefinir a senha. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <button className="auth-back-btn" onClick={() => navigate('/login')} aria-label="Voltar">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <BrandLogo variant="light" className="auth-logo" />

        {done ? (
          <>
            <div className="auth-success-icon">✅</div>
            <h1 className="auth-title">Senha redefinida</h1>
            <p className="auth-subtitle">Sua senha foi atualizada com sucesso. Agora você pode entrar.</p>
            <button
              type="button"
              className="auth-button"
              style={{ marginTop: '1.5rem' }}
              onClick={() => navigate('/login', { replace: true })}
            >
              Entrar
            </button>
          </>
        ) : (
          <>
            <h1 className="auth-title">Nova senha</h1>
            <p className="auth-subtitle">Escolha uma nova senha para sua conta.</p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <input
                type="password"
                placeholder="Nova senha (mínimo 8 caracteres)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="auth-input"
                autoFocus
              />
              <input
                type="password"
                placeholder="Confirmar nova senha"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                className="auth-input"
              />
              <button type="submit" disabled={loading} className="auth-button">
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

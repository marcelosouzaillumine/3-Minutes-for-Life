import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';
import { OauthError, oauthDecide, oauthInfo, parseOauthRequest, type EditorialAccess, type OauthInfo } from '../services/OauthService';
import './Autorizar.css';

// Tela de autorização do conector do Claude. O pedido vem pela barra de endereço; o admin vê quem pede, para onde volta e o que
// o Claude pode (e não pode) fazer, e decide. O token só nasce depois do "Autorizar", e a API confere a permissão de editor.

const WHY: Record<OauthError['code'], string> = {
  forbidden: 'Sua conta não tem permissão de editor de devocionais, então não pode autorizar este acesso.',
  invalid: 'Este pedido de acesso não é válido ou expirou. Volte ao Claude e tente conectar de novo.',
  unauthenticated: 'Sua sessão expirou. Entre de novo para continuar.',
  network: 'Não foi possível falar com o servidor agora. Tente de novo em instantes.',
};

export function Autorizar() {
  const { search } = useLocation();
  const { user, loading, signOut } = useAuth();
  const req = useMemo(() => parseOauthRequest(search), [search]);
  const [info, setInfo] = useState<OauthInfo | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'invalid'>(req ? 'loading' : 'invalid');
  const [access, setAccess] = useState<EditorialAccess>('write');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Sem login, entra e volta para cá com o pedido intacto.
  useEffect(() => {
    if (loading || user || !req) return;
    window.location.href = `/login?redirectTo=${encodeURIComponent(`/autorizar${search}`)}`;
  }, [loading, user, req, search]);

  useEffect(() => {
    if (!req || loading || !user) return;
    let alive = true;
    oauthInfo(req)
      .then((i) => alive && (setInfo(i), setState('ready')))
      .catch((e) => {
        if (!alive) return;
        setError(WHY[e instanceof OauthError ? e.code : 'invalid']);
        setState('invalid');
      });
    return () => {
      alive = false;
    };
  }, [req, loading, user]);

  // Sai e volta ao login com o pedido intacto, para quem está com a conta errada.
  async function switchAccount() {
    await signOut();
    window.location.href = `/login?redirectTo=${encodeURIComponent(`/autorizar${search}`)}`;
  }

  async function decide(decision: 'allow' | 'deny') {
    if (!req) return;
    setBusy(true);
    setError('');
    try {
      window.location.assign(await oauthDecide(req, decision, access));
    } catch (e) {
      setError(WHY[e instanceof OauthError ? e.code : 'invalid']);
      setBusy(false);
    }
  }

  return (
    <main className="oauth-page">
      <div className="oauth-card">
        <div className="oauth-logo"><BrandLogo /></div>
        <h1>Autorizar acesso</h1>
        {state === 'loading' && <p role="status">Carregando o pedido…</p>}
        {state === 'invalid' && <p role="alert" className="oauth-error">{error || WHY.invalid}</p>}
        {state === 'invalid' && user && req && (
          <p className="oauth-account">Conectado como <strong>{user.email}</strong>. <button type="button" className="oauth-link" onClick={() => void switchAccount()}>Entrar com outra conta</button></p>
        )}
        {state === 'ready' && info && (
          <>
            <p className="oauth-lead"><strong>{info.clientName}</strong> quer ajudar a equipe editorial do 3 Minutes for Life.</p>
            {user && <p className="oauth-account">Conectado como <strong>{user.email}</strong>. <button type="button" className="oauth-link" onClick={() => void switchAccount()}>Trocar de conta</button></p>}
            <fieldset>
              <legend>O que o Claude poderá fazer</legend>
              <label>
                <input type="radio" name="access" checked={access === 'write'} onChange={() => setAccess('write')} />
                Consultar o conteúdo e salvar rascunhos (devocionais, versões por faixa etária, traduções, textos de compartilhamento e planos)
              </label>
              <label>
                <input type="radio" name="access" checked={access === 'read'} onChange={() => setAccess('read')} />
                Só consultar o conteúdo, sem salvar nada
              </label>
            </fieldset>
            <ul className="oauth-limits" aria-label="O que nunca será permitido">
              <li>Nunca publica, apaga nem altera conteúdo já publicado: o que ele salva fica como rascunho para você revisar.</li>
              <li>Não acessa orações, mensagens pastorais, reflexões pessoais nem dados de usuários.</li>
            </ul>
            <p className="oauth-note">Ao autorizar, você volta para <strong>{info.redirectHost}</strong>. O acesso vale pelo seu usuário e expira se não for usado por 30 dias.</p>
            {error && <p role="alert" className="oauth-error">{error}</p>}
            <div className="oauth-actions">
              <button type="button" className="oauth-allow" disabled={busy} onClick={() => void decide('allow')}>Autorizar</button>
              <button type="button" className="oauth-deny" disabled={busy} onClick={() => void decide('deny')}>Cancelar</button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

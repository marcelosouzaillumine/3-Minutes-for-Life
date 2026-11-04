import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { illumineFetch } from '../lib/illumine';
import { LEGAL_VERSION } from '../lib/legal';
import { toE164, formatPhone } from '../utils/phone';
import './LegalUpdateGate.css';

const cacheKey = `3ml:legal:${LEGAL_VERSION}`;
const readCache = () => { try { return localStorage.getItem(cacheKey) === '1'; } catch { return false; } };
const writeCache = () => { try { localStorage.setItem(cacheKey, '1'); } catch { /* sem armazenamento: só pergunta de novo */ } };

type Status = 'checking' | 'needed' | 'ok';

/**
 * Pede o aceite dos Termos e da Política vigentes, uma vez por versão, e aproveita
 * para registrar o telefone e o consentimento (opcional) de WhatsApp.
 * Se o servidor não responder, não trava o app: tenta de novo na próxima abertura.
 */
export function LegalUpdateGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>(() => (readCache() ? 'ok' : 'checking'));
  const [savedPhone, setSavedPhone] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'checking') return;
    let alive = true;
    (async () => {
      try {
        const res = await illumineFetch(`/legal/acceptance?version=${LEGAL_VERSION}`);
        if (!res.ok) { if (alive) setStatus('ok'); return; }
        const body = await res.json();
        if (body.accepted) { writeCache(); if (alive) setStatus('ok'); return; }
        const me = await illumineFetch('/users/me').then((r) => (r.ok ? r.json() : null)).catch(() => null);
        if (!alive) return;
        setSavedPhone(typeof me?.phone === 'string' && me.phone ? me.phone : null);
        setStatus('needed');
      } catch {
        if (alive) setStatus('ok');
      }
    })();
    return () => { alive = false; };
  }, [status]);

  if (status === 'needed') {
    return <LegalUpdate savedPhone={savedPhone} onDone={() => { writeCache(); setStatus('ok'); }} />;
  }
  return <>{children}</>;
}

export function LegalUpdate({ savedPhone, onDone }: { savedPhone: string | null; onDone: () => void }) {
  const { t } = useTranslation('common');
  const tt = (k: string, d: string) => t(`legal.${k}`, { defaultValue: d }) as string;
  const [agree, setAgree] = useState(false);
  const [phone, setPhone] = useState(savedPhone ? formatPhone(savedPhone) : '');
  const [whats, setWhats] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const e164 = toE164(phone);
  const phoneBad = phone.trim() !== '' && !e164;
  const canSend = agree && !busy && (!whats || !!e164);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      if (e164 && e164 !== savedPhone) {
        const r = await illumineFetch('/users/me', { method: 'PATCH', body: JSON.stringify({ phone: e164 }) });
        if (!r.ok) throw new Error('phone');
      }
      if (whats && e164) {
        const r = await illumineFetch('/consent', {
          method: 'PUT',
          body: JSON.stringify({ consents: [{ channel: 'whatsapp', purpose: 'devotional', granted: true }] }),
        });
        if (!r.ok) throw new Error('consent');
      }
      const r = await illumineFetch('/legal/acceptance', {
        method: 'POST',
        body: JSON.stringify({ version: LEGAL_VERSION, documents: ['terms', 'privacy'] }),
      });
      if (!r.ok) throw new Error('accept');
      onDone();
    } catch {
      setError(tt('error', 'Não foi possível salvar agora. Tente de novo.'));
      setBusy(false);
    }
  };

  return (
    <div className="legalup" role="dialog" aria-modal="true" aria-labelledby="legalup-title">
      <div className="legalup__card">
        <p className="legalup__eyebrow">{tt('eyebrow', 'Atualização')}</p>
        <h1 id="legalup-title" className="legalup__title">{tt('title', 'Atualizamos nossos termos e a política de privacidade')}</h1>
        <p className="legalup__lead">{tt('lead', 'Para continuar, precisamos do seu aceite. Leva menos de um minuto.')}</p>

        <div className="legalup__changes">
          <b>{tt('changesTitle', 'O que mudou')}</b>
          <ul>
            <li>{tt('change1', 'Grupos e leitura com crianças: o que o grupo vê e o que não vê')}</li>
            <li>{tt('change2', 'Das crianças guardamos só um apelido e a faixa de idade')}</li>
            <li>{tt('change3', 'Como usamos seu telefone, só se você permitir')}</li>
          </ul>
        </div>
        <p className="legalup__links">
          <a href="/termos" target="_blank" rel="noopener noreferrer">{tt('terms', 'Ler os Termos de Uso')}</a>
          <a href="/privacidade" target="_blank" rel="noopener noreferrer">{tt('privacy', 'Ler a Política de Privacidade')}</a>
        </p>

        <label className="legalup__check">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>{tt('agree', 'Li e concordo com os Termos de Uso e a Política de Privacidade')} <em>{tt('required', 'obrigatório')}</em></span>
        </label>

        <section className="legalup__wa">
          <h2>{tt('waTitle', 'Receber pelo WhatsApp')} <em>{tt('optional', 'opcional')}</em></h2>
          <p>{savedPhone ? tt('waLeadSaved', 'Já temos o seu número. Quer receber lembretes do devocional e avisos do grupo?') : tt('waLead', 'Lembrete do devocional e avisos do seu grupo. Nada de propaganda.')}</p>
          <input
            className="legalup__phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+55 (11) 99999-9999"
            aria-label={tt('phone', 'Telefone com DDD')}
            aria-invalid={phoneBad}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {phoneBad && <p className="legalup__err">{tt('phoneBad', 'Confira o número, com DDD.')}</p>}
          <label className="legalup__check">
            <input type="checkbox" checked={whats} onChange={(e) => setWhats(e.target.checked)} />
            <span>{tt('waOptIn', 'Quero receber lembretes e avisos por WhatsApp neste número')}</span>
          </label>
          {whats && !e164 && <p className="legalup__err">{tt('waNeedsPhone', 'Informe o número para receber por WhatsApp.')}</p>}
          <p className="legalup__small">{tt('waNote', 'Você pode mudar ou cancelar isso a qualquer momento em Perfil.')}</p>
        </section>

        {error && <p className="legalup__err" role="alert">{error}</p>}
        <button type="button" className="legalup__cta" disabled={!canSend} onClick={submit}>
          {busy ? tt('saving', 'Salvando…') : tt('continue', 'Continuar')}
        </button>
      </div>
    </div>
  );
}

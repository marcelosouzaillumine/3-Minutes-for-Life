import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BANDS, FamilyError, FamilyService, inviteLink, pendingFamilyCode, type Band, type Family, type FamilyPrayer } from '../services/FamilyService';

const bandLabel = (b: Band) => b.replace('-', ' a ');

/** Perfil › Família: criar ou entrar, ver quem já leu hoje, convidar adultos e cadastrar crianças (só apelido e faixa). */
export function FamilySection() {
  const { t } = useTranslation('common');
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [meeting, setMeeting] = useState('');
  const [code, setCode] = useState(() => pendingFamilyCode.get() ?? '');
  const [nick, setNick] = useState('');
  const [band, setBand] = useState<Band>('7-10');
  const [copied, setCopied] = useState(false);
  const [prayers, setPrayers] = useState<FamilyPrayer[]>([]);
  const [prayerText, setPrayerText] = useState('');

  const fail = (e: unknown) => {
    const c = e instanceof FamilyError ? e.code : '';
    setError(
      c === 'INVALID_CODE' ? t('family.errors.code', 'Esse código não existe. Confira com quem convidou.')
      : c === 'FAMILY_FULL' ? t('family.errors.full', 'Essa família já está completa.')
      : c === 'ALREADY_IN_FAMILY' ? t('family.errors.already', 'Você já está em uma família.')
      : t('family.errors.generic', 'Não foi possível concluir. Tente de novo.'),
    );
  };

  const run = async (fn: () => Promise<Family | void>) => {
    setBusy(true);
    setError('');
    try {
      const r = await fn();
      if (r !== undefined) setFamily(r);
    } catch (e) { fail(e); }
    setBusy(false);
  };

  useEffect(() => {
    FamilyService.get().then(setFamily).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const hasFamily = !!family;
  useEffect(() => {
    if (hasFamily) FamilyService.prayers().then(setPrayers).catch(() => {});
  }, [hasFamily]);

  const runPrayers = async (fn: () => Promise<FamilyPrayer[]>) => {
    setBusy(true);
    setError('');
    try { setPrayers(await fn()); } catch (e) { fail(e); }
    setBusy(false);
  };

  if (loading) return null;
  const isOwner = family?.role === 'owner';

  if (!family) {
    return (
      <div className="family">
        <h3 className="consent-heading">{t('family.title', 'Família')}</h3>
        <p className="family__hint">{t('family.intro', 'Leiam o mesmo devocional no mesmo dia, com os adultos da casa e as crianças.')}</p>
        {error && <p className="consent-error">{error}</p>}
        <form className="family__form" onSubmit={(e) => { e.preventDefault(); if (code.trim()) run(async () => { const f = await FamilyService.join(code.trim()); pendingFamilyCode.clear(); setCode(''); return f; }); }}>
          <label>{t('family.haveCode', 'Recebi um código de convite')}</label>
          <div className="family__row">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCD-2345" maxLength={12} aria-label={t('family.code', 'Código')} />
            <button type="submit" className="btn-secondary" disabled={busy || !code.trim()}>{t('family.join', 'Entrar')}</button>
          </div>
        </form>
        <form className="family__form" onSubmit={(e) => { e.preventDefault(); if (name.trim()) run(() => FamilyService.create(name.trim(), meeting.trim())); }}>
          <label>{t('family.createLabel', 'Ou crie a sua')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('family.namePlaceholder', 'Família Souza')} maxLength={60} aria-label={t('family.name', 'Nome da família')} />
          <input value={meeting} onChange={(e) => setMeeting(e.target.value)} placeholder={t('family.meetingPlaceholder', 'Horário combinado (opcional), ex.: jantar, 20h')} maxLength={60} aria-label={t('family.meeting', 'Horário combinado')} />
          <button type="submit" className="btn-secondary" disabled={busy || !name.trim()}>{t('family.create', 'Criar família')}</button>
        </form>
      </div>
    );
  }

  const link = inviteLink(family.inviteCode);
  const message = t('family.inviteMessage', { link, defaultValue: 'Vem ler o devocional com a nossa família: {{link}}' });
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* sem permissão */ }
  };

  return (
    <div className="family">
      <h3 className="consent-heading">{family.name}</h3>
      {family.meetingTime && <p className="family__hint">{family.meetingTime}</p>}
      {error && <p className="consent-error">{error}</p>}

      <p className="family__label">{t('family.readToday', 'Quem já leu hoje')}</p>
      <ul className="family__members">
        {family.members.map((m, i) => (
          <li key={i} className={m.readToday ? 'is-read' : ''}>
            <span className="family__dot" aria-hidden="true">{m.readToday ? '✓' : ''}</span>
            {m.displayName ?? t('family.someone', 'Alguém')}{m.isMe ? ` (${t('family.you', 'você')})` : ''}
          </li>
        ))}
      </ul>

      <p className="family__label">{t('family.children', 'Crianças')}</p>
      {family.children.length > 0 && (
        <ul className="family__members">
          {family.children.map((c) => (
            <li key={c.id}>
              {c.nickname} · {t('kids.ages', { range: bandLabel(c.band), defaultValue: '{{range}} anos' })}
              {isOwner && <button type="button" className="family__link" disabled={busy} onClick={() => run(() => FamilyService.removeChild(c.id))}>{t('family.remove', 'Remover')}</button>}
            </li>
          ))}
        </ul>
      )}
      {isOwner ? (
        <form className="family__row" onSubmit={(e) => { e.preventDefault(); if (nick.trim()) run(async () => { const f = await FamilyService.addChild(nick.trim(), band); setNick(''); return f; }); }}>
          <input value={nick} onChange={(e) => setNick(e.target.value)} placeholder={t('family.nickname', 'Apelido')} maxLength={20} aria-label={t('family.nickname', 'Apelido')} />
          <select value={band} onChange={(e) => setBand(e.target.value as Band)} aria-label={t('family.band', 'Faixa de idade')}>
            {BANDS.map((b) => <option key={b} value={b}>{bandLabel(b)}</option>)}
          </select>
          <button type="submit" className="btn-secondary" disabled={busy || !nick.trim()}>{t('family.addChild', 'Adicionar')}</button>
        </form>
      ) : null}
      <p className="family__hint">{t('family.childPrivacy', 'Crianças não têm conta: guardamos só o apelido e a faixa de idade, nunca sobrenome, foto ou e-mail.')}</p>

      <p className="family__label">{t('family.prayers.title', 'Mural de oração')}</p>
      <form className="family__row" onSubmit={(e) => { e.preventDefault(); const text = prayerText.trim(); if (text) runPrayers(async () => { const r = await FamilyService.addPrayer(text); setPrayerText(''); return r; }); }}>
        <input value={prayerText} onChange={(e) => setPrayerText(e.target.value)} maxLength={280} placeholder={t('family.prayers.placeholder', 'Um pedido para a família orar')} aria-label={t('family.prayers.placeholder', 'Um pedido para a família orar')} />
        <button type="submit" className="btn-secondary" disabled={busy || !prayerText.trim()}>{t('family.prayers.add', 'Publicar')}</button>
      </form>
      {prayers.length === 0 ? (
        <p className="family__hint">{t('family.prayers.empty', 'Nenhum pedido ainda.')}</p>
      ) : (
        <ul className="family__prayers">
          {prayers.map((p) => (
            <li key={p.id}>
              <span className="family__prayer-author">{p.authorName ?? t('family.someone', 'Alguém')}</span>
              <p>{p.text}</p>
              <div className="family__row">
                <button type="button" className={`family__amen${p.prayedByMe ? ' is-on' : ''}`} disabled={busy} aria-pressed={p.prayedByMe} onClick={() => runPrayers(() => FamilyService.togglePrayed(p.id))}>
                  {p.prayedByMe ? t('family.prayers.iPrayed', 'Eu orei') : t('family.prayers.pray', 'Orar')}{p.prayedCount > 0 ? ` · ${p.prayedCount}` : ''}
                </button>
                {p.canDelete && <button type="button" className="family__link" disabled={busy} onClick={() => runPrayers(() => FamilyService.removePrayer(p.id))}>{t('family.remove', 'Remover')}</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="family__hint">{t('family.prayers.privacy', 'Só a família vê. Quem criou a família modera e pode remover qualquer pedido.')}</p>

      <p className="family__label">{t('family.invite', 'Convidar um adulto')}</p>
      <div className="family__row">
        <a className="btn-secondary" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">{t('family.whatsapp', 'Enviar pelo WhatsApp')}</a>
        <button type="button" className="btn-secondary" onClick={copy}>{copied ? t('family.copied', 'Copiado') : t('family.copy', 'Copiar link')}</button>
      </div>
      <p className="family__hint">{t('family.codeIs', 'Código')}: <strong>{family.inviteCode}</strong>
        {isOwner && <button type="button" className="family__link" disabled={busy} onClick={() => run(() => FamilyService.rotateInvite())}>{t('family.newCode', 'Gerar novo código')}</button>}
      </p>

      <button type="button" className="family__leave" disabled={busy}
        onClick={() => { if (window.confirm(isOwner ? t('family.confirmDelete', 'Apagar a família? Os adultos saem do grupo e os apelidos das crianças são apagados.') : t('family.confirmLeave', 'Sair desta família?'))) run(async () => { await FamilyService.leave(); setFamily(null); }); }}>
        {isOwner ? t('family.delete', 'Apagar família') : t('family.leave', 'Sair da família')}
      </button>
    </div>
  );
}

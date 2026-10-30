import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet } from '../components/Sheet';
import {
  BANDS, FamilyError, FamilyService, inviteLink, pendingFamilyCode,
  type Band, type Family as FamilyT, type FamilyPrayer, type PlanTemplate,
} from '../services/FamilyService';
import '../styles/family.css';

type SheetKind = null | 'create' | 'join' | 'invite' | 'manage' | 'plan' | 'prayer';

const initials = (name: string | null) => (name ?? '?').trim().slice(0, 2).replace(/^./, (c) => c.toUpperCase());
const bandLabel = (b: Band) => b.replace('-', ' a ');

export const openRitual = (source: 'daily' | 'plan' = 'daily') =>
  window.dispatchEvent(new CustomEvent('family:ritual', { detail: source }));

/** Aba Família: o espaço da casa. Quem leu, a semana, o plano em andamento e o mural. */
export function Family() {
  const { t, i18n } = useTranslation('common');
  const tt = (k: string, d: string, o?: Record<string, unknown>) => t(`fam.${k}`, { defaultValue: d, ...o });

  const [family, setFamily] = useState<FamilyT | null>(null);
  const [loading, setLoading] = useState(true);
  const [prayers, setPrayers] = useState<FamilyPrayer[]>([]);
  const [templates, setTemplates] = useState<PlanTemplate[]>([]);
  const [sheet, setSheet] = useState<SheetKind>(() => (pendingFamilyCode.get() ? 'join' : null));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [meeting, setMeeting] = useState('');
  const [code, setCode] = useState(() => pendingFamilyCode.get() ?? '');
  const [nick, setNick] = useState('');
  const [band, setBand] = useState<Band>('7-10');
  const [prayerText, setPrayerText] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const fail = (e: unknown) => {
    const c = e instanceof FamilyError ? e.code : '';
    setError(
      c === 'INVALID_CODE' ? tt('err.code', 'Esse código não existe. Confira com quem convidou.')
      : c === 'FAMILY_FULL' ? tt('err.full', 'Essa família já está completa.')
      : c === 'ALREADY_IN_FAMILY' ? tt('err.already', 'Você já está em uma família.')
      : tt('err.generic', 'Não foi possível concluir. Tente de novo.'),
    );
  };

  const run = async <T,>(fn: () => Promise<T>, then?: (r: T) => void) => {
    setBusy(true);
    setError('');
    try { const r = await fn(); then?.(r); } catch (e) { fail(e); }
    setBusy(false);
  };

  const load = useCallback(async () => {
    try {
      const f = await FamilyService.get();
      setFamily(f);
      if (f) {
        FamilyService.prayers().then(setPrayers).catch(() => {});
        FamilyService.templates().then(setTemplates).catch(() => {});
      }
    } catch { /* tela segue vazia */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const close = () => { setSheet(null); setError(''); setConfirmLeave(false); };
  const apply = (f: FamilyT) => { setFamily(f); close(); };

  if (loading) return <div className="fam fam--loading">{tt('loading', 'Carregando…')}</div>;

  /* ── Sem família: um convite, não um formulário ── */
  if (!family) {
    return (
      <div className="fam">
        <div className="fam-hero">
          <p className="fam-eyebrow">{tt('title', 'Família')}</p>
          <h1 className="fam-hero__title">{tt('hero.title', 'Leiam juntos')}</h1>
          <p className="fam-hero__text">{tt('hero.text', 'Três minutos por dia, com a mesma passagem para todos da casa. Os adultos veem quem já leu e as crianças têm a sua própria versão.')}</p>
          <button type="button" className="fam-btn fam-btn--primary" onClick={() => setSheet('create')}>{tt('hero.create', 'Criar a nossa família')}</button>
          <button type="button" className="fam-btn fam-btn--ghost" onClick={() => setSheet('join')}>{tt('hero.join', 'Tenho um código de convite')}</button>
          <p className="fam-note">{tt('childPrivacy', 'Crianças não têm conta: guardamos só o apelido e a faixa de idade, nunca sobrenome, foto ou e-mail.')}</p>
        </div>

        {sheet === 'create' && (
          <Sheet title={tt('create.title', 'Nova família')} onClose={close}>
            <form className="fam-form" onSubmit={(e) => { e.preventDefault(); if (name.trim()) run(() => FamilyService.create(name.trim(), meeting.trim()), apply); }}>
              <label>{tt('create.name', 'Nome da família')}<input value={name} onChange={(e) => setName(e.target.value)} placeholder={tt('create.namePh', 'Família Souza')} maxLength={60} autoFocus /></label>
              <label>{tt('create.meeting', 'Horário combinado (opcional)')}<input value={meeting} onChange={(e) => setMeeting(e.target.value)} placeholder={tt('create.meetingPh', 'Jantar, 20h')} maxLength={60} /></label>
              {error && <p className="fam-error">{error}</p>}
              <button type="submit" className="fam-btn fam-btn--primary" disabled={busy || !name.trim()}>{tt('create.cta', 'Criar família')}</button>
            </form>
          </Sheet>
        )}
        {sheet === 'join' && (
          <Sheet title={tt('join.title', 'Entrar numa família')} onClose={close}>
            <form className="fam-form" onSubmit={(e) => { e.preventDefault(); if (code.trim()) run(() => FamilyService.join(code.trim()), (f) => { pendingFamilyCode.clear(); setCode(''); apply(f); load(); }); }}>
              <label>{tt('join.code', 'Código de convite')}<input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCD-2345" maxLength={12} autoFocus /></label>
              {error && <p className="fam-error">{error}</p>}
              <button type="submit" className="fam-btn fam-btn--primary" disabled={busy || !code.trim()}>{tt('join.cta', 'Entrar')}</button>
            </form>
          </Sheet>
        )}
      </div>
    );
  }

  const isOwner = family.role === 'owner';
  const link = inviteLink(family.inviteCode);
  const inviteMsg = tt('inviteMessage', 'Vem ler o devocional com a nossa família: {{link}}', { link });
  const readers = family.members.filter((m) => m.readToday).length;
  const plan = family.plan;
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* sem permissão */ } };
  const dayInitial = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(i18n.language, { weekday: 'narrow' });
  const setPrayersFrom = (fn: () => Promise<FamilyPrayer[]>, after?: () => void) => run(fn, (p) => { setPrayers(p); after?.(); });

  return (
    <div className="fam">
      <header className="fam-head">
        <div>
          <p className="fam-eyebrow">{tt('title', 'Família')}</p>
          <h1 className="fam-head__name">{family.name}</h1>
          <p className="fam-head__sub">
            {family.week.streak > 0 ? tt('streak', '{{count}} dias lendo juntos', { count: family.week.streak }) : tt('streak0', 'Comecem hoje')}
            {family.meetingTime ? ` · ${family.meetingTime}` : ''}
          </p>
        </div>
        <button type="button" className="fam-icon-btn" onClick={() => setSheet('manage')} aria-label={tt('manage.title', 'Gerenciar família')}>⋯</button>
      </header>

      <div className="fam-week" aria-label={tt('week', 'Últimos 7 dias')}>
        {family.week.days.map((d) => (
          <span key={d.date} className={`fam-week__day${d.read ? ' is-read' : ''}`}><i>{dayInitial(d.date)}</i></span>
        ))}
      </div>

      <section className="fam-people" aria-label={tt('who', 'Quem lê')}>
        {family.members.map((m, i) => (
          <div key={i} className="fam-person">
            <span className={`fam-avatar${m.readToday ? ' is-read' : ''}`}>{initials(m.displayName)}</span>
            <span className="fam-person__label">{m.isMe ? tt('you', 'você') : m.displayName ?? tt('someone', 'Alguém')}</span>
            <span className="fam-person__state">{m.readToday ? tt('read', 'leu hoje') : tt('notYet', 'ainda não')}</span>
          </div>
        ))}
        {family.children.map((c) => (
          <div key={c.id} className="fam-person">
            <span className="fam-avatar fam-avatar--child">{initials(c.nickname)}</span>
            <span className="fam-person__label">{c.nickname}</span>
            <span className="fam-person__state">{bandLabel(c.band)}</span>
          </div>
        ))}
        <button type="button" className="fam-person fam-person--add" onClick={() => setSheet('invite')}>
          <span className="fam-avatar fam-avatar--add">+</span>
          <span className="fam-person__label">{tt('invite.short', 'convidar')}</span>
        </button>
      </section>
      <p className="fam-note">{readers > 0 ? tt('readersToday', '{{count}} de {{total}} já leram hoje', { count: readers, total: family.members.length }) : tt('noneToday', 'Ninguém leu hoje ainda.')}</p>

      <button type="button" className="fam-btn fam-btn--primary fam-cta" onClick={() => openRitual('daily')}>{tt('ritual', 'Ler em família')}</button>

      {/* ── Plano ── */}
      {plan && !plan.completed && (
        <section className="fam-card fam-card--accent">
          <div className="fam-card__row"><span className="fam-eyebrow fam-eyebrow--accent">{tt('plan.label', 'Plano da família')}</span><span className="fam-note">{tt('plan.day', 'dia {{n}} de {{total}}', { n: plan.currentDay, total: plan.days.length })}</span></div>
          <h2 className="fam-card__title">{plan.title}</h2>
          <div className="fam-dots">{plan.days.map((d) => <span key={d.day} className={`fam-dot${d.done ? ' is-done' : ''}${d.day === plan.currentDay ? ' is-now' : ''}`} />)}</div>
          {!plan.lockedUntilTomorrow && <p className="fam-card__text">{tt('plan.today', 'Hoje no plano: {{title}}', { title: plan.days[plan.currentDay - 1]?.title })}</p>}
          {plan.lockedUntilTomorrow
            ? <p className="fam-note">{tt('plan.locked', 'Hoje vocês já leram o dia {{n}}. O dia {{next}} libera amanhã.', { n: plan.currentDay - 1, next: plan.currentDay })}</p>
            : <button type="button" className="fam-btn fam-btn--secondary" onClick={() => openRitual('plan')}>{tt('plan.read', 'Ler o dia do plano em família')}</button>}
        </section>
      )}
      {plan?.completed && plan.summary && (
        <section className="fam-card fam-card--accent fam-summary">
          <span className="fam-eyebrow fam-eyebrow--accent">{tt('summary.label', 'Semana concluída')}</span>
          <h2 className="fam-card__title">{tt('summary.title', 'Vocês leram juntos {{n}} de {{total}} dias', { n: plan.summary.daysTogether, total: plan.summary.total })}</h2>
          <p className="fam-note">{tt('summary.word', 'A palavra que ficou')}</p>
          <p className="fam-summary__word">{plan.summary.word}</p>
          <p className="fam-card__text">{tt('summary.prayers', '{{count}} orações pelos pedidos da família', { count: plan.summary.prayersOrdered })}</p>
          <p className="fam-card__text">{tt('summary.question', 'Para continuar a conversa: o que vocês agradeceriam a Deus por esta semana?')}</p>
          {isOwner && <button type="button" className="fam-btn fam-btn--secondary" onClick={() => setSheet('plan')}>{tt('plan.next', 'Começar o próximo plano')}</button>}
          <p className="fam-note">{tt('summary.noScore', 'Sem placar de quem faltou.')}</p>
        </section>
      )}
      {!plan && isOwner && templates.length > 0 && (
        <button type="button" className="fam-card fam-card--dashed" onClick={() => setSheet('plan')}>
          <span className="fam-eyebrow">{tt('plan.label', 'Plano da família')}</span>
          <strong>{tt('plan.choose', 'Escolher um plano de 7 dias')}</strong>
          <span className="fam-note">{tt('plan.chooseHint', 'Uma trilha para ler junto, um dia de cada vez.')}</span>
        </button>
      )}

      {/* ── Mural ── */}
      <section className="fam-section">
        <div className="fam-card__row"><h2 className="fam-section__title">{tt('prayers.title', 'Mural de oração')}</h2><button type="button" className="fam-link" onClick={() => setSheet('prayer')}>{tt('prayers.new', 'Novo pedido')}</button></div>
        {prayers.length === 0 ? <p className="fam-note">{tt('prayers.empty', 'Nenhum pedido ainda. Só a família vê.')}</p> : (
          <ul className="fam-prayers">
            {prayers.map((p) => (
              <li key={p.id} className="fam-prayer">
                <p className="fam-prayer__text">{p.text}</p>
                <div className="fam-card__row">
                  <span className="fam-note">{p.authorName ?? tt('someone', 'Alguém')}</span>
                  <span className="fam-prayer__actions">
                    {p.canDelete && <button type="button" className="fam-link fam-link--muted" disabled={busy} onClick={() => setPrayersFrom(() => FamilyService.removePrayer(p.id))}>{tt('remove', 'Remover')}</button>}
                    <button type="button" className={`fam-chip${p.prayedByMe ? ' is-on' : ''}`} aria-pressed={p.prayedByMe} disabled={busy} onClick={() => setPrayersFrom(() => FamilyService.togglePrayed(p.id))}>
                      {p.prayedByMe ? tt('prayers.iPrayed', 'Eu orei') : tt('prayers.pray', 'Orar')}{p.prayedCount > 0 ? ` · ${p.prayedCount}` : ''}
                    </button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="fam-note">{tt('prayers.privacy', 'Só a família vê. Quem criou a família modera e pode remover qualquer pedido.')}</p>
      </section>

      {/* ── Folhas ── */}
      {sheet === 'invite' && (
        <Sheet title={tt('invite.title', 'Convidar um adulto')} onClose={close}>
          <p className="fam-note">{tt('invite.text', 'Cada adulto entra com a própria conta. Nenhum telefone é guardado.')}</p>
          <a className="fam-btn fam-btn--primary" href={`https://wa.me/?text=${encodeURIComponent(inviteMsg)}`} target="_blank" rel="noopener noreferrer">{tt('invite.whatsapp', 'Enviar pelo WhatsApp')}</a>
          <button type="button" className="fam-btn fam-btn--secondary" onClick={copy}>{copied ? tt('copied', 'Copiado') : tt('invite.copy', 'Copiar link')}</button>
          <p className="fam-note">{tt('invite.code', 'Código')}: <strong>{family.inviteCode}</strong></p>
        </Sheet>
      )}

      {sheet === 'prayer' && (
        <Sheet title={tt('prayers.new', 'Novo pedido')} onClose={close}>
          <form className="fam-form" onSubmit={(e) => { e.preventDefault(); const text = prayerText.trim(); if (text) setPrayersFrom(() => FamilyService.addPrayer(text), () => { setPrayerText(''); close(); }); }}>
            <label>{tt('prayers.ph', 'Um pedido para a família orar')}<textarea rows={4} value={prayerText} onChange={(e) => setPrayerText(e.target.value)} maxLength={280} autoFocus /></label>
            <p className="fam-note fam-note--right">{prayerText.length}/280</p>
            {error && <p className="fam-error">{error}</p>}
            <button type="submit" className="fam-btn fam-btn--primary" disabled={busy || !prayerText.trim()}>{tt('prayers.add', 'Publicar')}</button>
          </form>
        </Sheet>
      )}

      {sheet === 'plan' && (
        <Sheet title={tt('plan.sheet', 'Escolha o plano')} onClose={close}>
          {templates.map((p) => (
            <div key={p.id} className="fam-card">
              <h2 className="fam-card__title">{p.title}</h2>
              <p className="fam-card__text">{p.description}</p>
              <p className="fam-note">{tt('plan.days', '{{count}} dias', { count: p.days })} · {p.themeWord}</p>
              <button type="button" className="fam-btn fam-btn--primary" disabled={busy} onClick={() => run(() => FamilyService.setPlan(p.id), apply)}>{tt('plan.start', 'Começar')}</button>
            </div>
          ))}
          {error && <p className="fam-error">{error}</p>}
        </Sheet>
      )}

      {sheet === 'manage' && (
        <Sheet title={tt('manage.title', 'Gerenciar família')} onClose={close}>
          {isOwner && (
            <form className="fam-form" onSubmit={(e) => { e.preventDefault(); run(() => FamilyService.update(name.trim() || family.name, meeting.trim()), apply); }}>
              <label>{tt('create.name', 'Nome da família')}<input value={name || family.name} onChange={(e) => setName(e.target.value)} maxLength={60} /></label>
              <label>{tt('create.meeting', 'Horário combinado (opcional)')}<input value={meeting || family.meetingTime || ''} onChange={(e) => setMeeting(e.target.value)} maxLength={60} /></label>
              <button type="submit" className="fam-btn fam-btn--secondary" disabled={busy}>{tt('save', 'Salvar')}</button>
            </form>
          )}

          <h4 className="fam-section__title">{tt('children', 'Crianças')}</h4>
          {family.children.map((c) => (
            <div key={c.id} className="fam-row">
              <span>{c.nickname} · {tt('ages', '{{range}} anos', { range: bandLabel(c.band) })}</span>
              {isOwner && <button type="button" className="fam-link fam-link--muted" disabled={busy} onClick={() => run(() => FamilyService.removeChild(c.id), setFamily)}>{tt('remove', 'Remover')}</button>}
            </div>
          ))}
          {isOwner && (
            <form className="fam-inline" onSubmit={(e) => { e.preventDefault(); if (nick.trim()) run(() => FamilyService.addChild(nick.trim(), band), (f) => { setFamily(f); setNick(''); }); }}>
              <input value={nick} onChange={(e) => setNick(e.target.value)} placeholder={tt('nickname', 'Apelido')} maxLength={20} aria-label={tt('nickname', 'Apelido')} />
              <select value={band} onChange={(e) => setBand(e.target.value as Band)} aria-label={tt('band', 'Faixa de idade')}>{BANDS.map((b) => <option key={b} value={b}>{bandLabel(b)}</option>)}</select>
              <button type="submit" className="fam-btn fam-btn--secondary" disabled={busy || !nick.trim()}>{tt('add', 'Adicionar')}</button>
            </form>
          )}
          <p className="fam-note">{tt('childPrivacy', 'Crianças não têm conta: guardamos só o apelido e a faixa de idade, nunca sobrenome, foto ou e-mail.')}</p>

          {isOwner && plan && <button type="button" className="fam-btn fam-btn--ghost" disabled={busy} onClick={() => run(() => FamilyService.clearPlan(), setFamily)}>{tt('plan.stop', 'Encerrar o plano atual')}</button>}
          {isOwner && <button type="button" className="fam-btn fam-btn--ghost" disabled={busy} onClick={() => run(() => FamilyService.rotateInvite(), setFamily)}>{tt('invite.new', 'Gerar novo código de convite')}</button>}
          {error && <p className="fam-error">{error}</p>}

          {!confirmLeave ? (
            <button type="button" className="fam-btn fam-btn--danger" onClick={() => setConfirmLeave(true)}>{isOwner ? tt('delete', 'Apagar família') : tt('leave', 'Sair da família')}</button>
          ) : (
            <div className="fam-confirm">
              <p>{isOwner ? tt('confirmDelete', 'Apagar a família? Os adultos saem do grupo e tudo o que foi guardado é apagado, inclusive os apelidos das crianças e o mural.') : tt('confirmLeave', 'Sair desta família?')}</p>
              <button type="button" className="fam-btn fam-btn--danger" disabled={busy} onClick={() => run(() => FamilyService.leave(), () => { setFamily(null); setPrayers([]); close(); })}>{tt('confirmYes', 'Sim, continuar')}</button>
              <button type="button" className="fam-btn fam-btn--ghost" onClick={() => setConfirmLeave(false)}>{tt('cancel', 'Cancelar')}</button>
            </div>
          )}
        </Sheet>
      )}
    </div>
  );
}

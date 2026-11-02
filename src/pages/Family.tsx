import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet } from '../components/Sheet';
import {
  FamilyError, FamilyService, activeFamily, inviteLink, pendingFamilyCode,
  type Family as FamilyT, type FamilySummary, type FamilyPrayer, type PlanTemplate,
} from '../services/FamilyService';
import '../styles/family.css';

type SheetKind = null | 'create' | 'join' | 'invite' | 'manage' | 'plan' | 'prayer' | 'groups';

const initials = (name: string | null) => (name ?? '?').trim().slice(0, 2).replace(/^./, (c) => c.toUpperCase());

/** Abre o Ler juntos. Com `audience`, a pessoa já chega sabendo com quem lê e a tela de escolha some. */
export const openRitual = (source: 'daily' | 'plan' = 'daily', audience?: 'adults' | 'kids') =>
  window.dispatchEvent(new CustomEvent('family:ritual', { detail: { source, audience } }));

/** Aba Grupo (família, casal ou amigos): cada um lê no seu tempo e todos veem quem já leu. Quem leu, a semana, o plano em andamento e o mural. */
export function Family() {
  const { t, i18n } = useTranslation('common');
  const tt = (k: string, d: string, o?: Record<string, unknown>) => t(`fam.${k}`, { defaultValue: d, ...o });

  const [family, setFamily] = useState<FamilyT | null>(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<{ families: FamilySummary[]; max: number }>({ families: [], max: 5 });
  const [prayers, setPrayers] = useState<FamilyPrayer[]>([]);
  const [templates, setTemplates] = useState<PlanTemplate[]>([]);
  const [sheet, setSheet] = useState<SheetKind>(() => (pendingFamilyCode.get() ? 'join' : null));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [meeting, setMeeting] = useState('');
  const [code, setCode] = useState(() => pendingFamilyCode.get() ?? '');
  const [prayerText, setPrayerText] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const fail = (e: unknown) => {
    const c = e instanceof FamilyError ? e.code : '';
    setError(
      c === 'INVALID_CODE' ? tt('err.code', 'Esse código não existe. Confira com quem convidou.')
      : c === 'FAMILY_FULL' ? tt('err.full', 'Este grupo já está completo.')
      : c === 'TOO_MANY_GROUPS' ? tt('err.groups', 'Você já está no máximo de grupos. Saia de um para entrar em outro.')
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
      FamilyService.list().then(setGroups).catch(() => {});
      if (f) {
        FamilyService.prayers().then(setPrayers).catch(() => {});
        FamilyService.templates().then(setTemplates).catch(() => {});
      }
    } catch { /* tela segue vazia */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  // Trocar de grupo (aqui ou em outra aba do app) recarrega a tela.
  useEffect(() => {
    const onChange = () => { load(); };
    window.addEventListener('family:changed', onChange);
    return () => window.removeEventListener('family:changed', onChange);
  }, [load]);

  const close = () => { setSheet(null); setError(''); setConfirmLeave(false); };
  const apply = (f: FamilyT) => { setFamily(f); close(); };

  const groupSheets = (
    <>
      {sheet === 'create' && (
        <Sheet title={tt('create.title', 'Novo grupo')} onClose={close}>
          <form className="fam-form" onSubmit={(e) => { e.preventDefault(); if (name.trim()) run(() => FamilyService.create(name.trim(), meeting.trim()), apply); }}>
            <label>{tt('create.name', 'Nome do grupo')}<input value={name} onChange={(e) => setName(e.target.value)} placeholder={tt('create.namePh', 'Família Souza ou Célula de quinta')} maxLength={60} autoFocus /></label>
            <label>{tt('create.meeting', 'Horário combinado (opcional)')}<input value={meeting} onChange={(e) => setMeeting(e.target.value)} placeholder={tt('create.meetingPh', 'Jantar, 20h')} maxLength={60} /></label>
            {error && <p className="fam-error">{error}</p>}
            <button type="submit" className="fam-btn fam-btn--primary" disabled={busy || !name.trim()}>{tt('create.cta', 'Criar grupo')}</button>
          </form>
        </Sheet>
      )}
      {sheet === 'join' && (
        <Sheet title={tt('join.title', 'Entrar num grupo')} onClose={close}>
          <form className="fam-form" onSubmit={(e) => { e.preventDefault(); if (code.trim()) run(() => FamilyService.join(code.trim()), (f) => { pendingFamilyCode.clear(); setCode(''); apply(f); load(); }); }}>
            <label>{tt('join.code', 'Código de convite')}<input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCD-2345" maxLength={12} autoFocus /></label>
            {error && <p className="fam-error">{error}</p>}
            <button type="submit" className="fam-btn fam-btn--primary" disabled={busy || !code.trim()}>{tt('join.cta', 'Entrar')}</button>
          </form>
        </Sheet>
      )}
    </>
  );

  if (loading) return <div className="fam fam--loading">{tt('loading', 'Carregando…')}</div>;

  /* ── Sem família: um convite, não um formulário ── */
  if (!family) {
    return (
      <div className="fam">
        <div className="fam-hero">
          <p className="fam-eyebrow">{tt('title', 'Grupo')}</p>
          <h1 className="fam-hero__title">{tt('hero.title', 'Cada um no seu tempo, todos na mesma Palavra')}</h1>
          <p className="fam-hero__text">{tt('hero.text', 'Três minutos por dia, com a mesma passagem para todos. Família, casal ou grupo: cada um lê quando puder e todos veem quem já leu.')}</p>
          <button type="button" className="fam-btn fam-btn--primary" onClick={() => setSheet('create')}>{tt('hero.create', 'Criar o nosso grupo')}</button>
          <button type="button" className="fam-btn fam-btn--ghost" onClick={() => setSheet('join')}>{tt('hero.join', 'Tenho um código de convite')}</button>
        </div>

        {groupSheets}
      </div>
    );
  }

  const isOwner = family.role === 'owner';
  const link = inviteLink(family.inviteCode);
  const inviteMsg = tt('inviteMessage', 'Vem ler o devocional com a gente: {{link}}', { link });
  const readers = family.members.filter((m) => m.readToday).length;
  const plan = family.plan;
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* sem permissão */ } };
  const dayInitial = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(i18n.language, { weekday: 'narrow' });
  const setPrayersFrom = (fn: () => Promise<FamilyPrayer[]>, after?: () => void) => run(fn, (p) => { setPrayers(p); after?.(); });

  return (
    <div className="fam">
      <header className="fam-head">
        <div>
          <p className="fam-eyebrow">{tt('title', 'Grupo')}</p>
          <button type="button" className="fam-pick" onClick={() => setSheet('groups')} aria-haspopup="dialog">
            <h1 className="fam-head__name">{family.name}</h1><span aria-hidden="true">▾</span>
          </button>
          <p className="fam-head__sub">
            {family.week.streak > 0 ? tt('streak', '{{count}} dias lendo juntos', { count: family.week.streak }) : tt('streak0', 'Comecem hoje')}
            {family.meetingTime ? ` · ${family.meetingTime}` : ''}
          </p>
        </div>
        <button type="button" className="fam-icon-btn" onClick={() => setSheet('manage')} aria-label={tt('manage.title', 'Gerenciar grupo')}>⋯</button>
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
        <button type="button" className="fam-person fam-person--add" onClick={() => setSheet('invite')}>
          <span className="fam-avatar fam-avatar--add">+</span>
          <span className="fam-person__label">{tt('invite.short', 'convidar')}</span>
        </button>
      </section>
      <p className="fam-note">{readers > 0 ? tt('readersToday', '{{count}} de {{total}} já leram hoje', { count: readers, total: family.members.length }) : tt('noneToday', 'Ninguém leu hoje ainda.')}</p>

      <button type="button" className="fam-btn fam-btn--primary fam-cta" onClick={() => openRitual('daily', 'adults')}>{tt('ritual', 'Ler juntos')}</button>

      {/* ── Plano ── */}
      {plan && !plan.completed && (
        <section className="fam-card fam-card--accent">
          <div className="fam-card__row"><span className="fam-eyebrow fam-eyebrow--accent">{tt('plan.label', 'Plano do grupo')}</span><span className="fam-note">{tt('plan.day', 'dia {{n}} de {{total}}', { n: plan.currentDay, total: plan.days.length })}</span></div>
          <h2 className="fam-card__title">{plan.title}</h2>
          <div className="fam-dots">{plan.days.map((d) => <span key={d.day} className={`fam-dot${d.done ? ' is-done' : ''}${d.day === plan.currentDay ? ' is-now' : ''}`} />)}</div>
          {!plan.lockedUntilTomorrow && <p className="fam-card__text">{tt('plan.today', 'Hoje no plano: {{title}}', { title: plan.days[plan.currentDay - 1]?.title })}</p>}
          {plan.lockedUntilTomorrow
            ? <p className="fam-note">{tt('plan.locked', 'Hoje vocês já leram o dia {{n}}. O dia {{next}} libera amanhã.', { n: plan.currentDay - 1, next: plan.currentDay })}</p>
            : <button type="button" className="fam-btn fam-btn--secondary" onClick={() => openRitual('plan', 'adults')}>{tt('plan.read', 'Ler o dia do plano juntos')}</button>}
        </section>
      )}
      {plan?.completed && plan.summary && (
        <section className="fam-card fam-card--accent fam-summary">
          <span className="fam-eyebrow fam-eyebrow--accent">{tt('summary.label', 'Semana concluída')}</span>
          <h2 className="fam-card__title">{tt('summary.title', 'Vocês leram juntos {{n}} de {{total}} dias', { n: plan.summary.daysTogether, total: plan.summary.total })}</h2>
          <p className="fam-note">{tt('summary.word', 'A palavra que ficou')}</p>
          <p className="fam-summary__word">{plan.summary.word}</p>
          <p className="fam-card__text">{tt('summary.prayers', '{{count}} orações pelos pedidos do grupo', { count: plan.summary.prayersOrdered })}</p>
          <p className="fam-card__text">{tt('summary.question', 'Para continuar a conversa: o que vocês agradeceriam a Deus por esta semana?')}</p>
          {isOwner && <button type="button" className="fam-btn fam-btn--secondary" onClick={() => setSheet('plan')}>{tt('plan.next', 'Começar o próximo plano')}</button>}
          <p className="fam-note">{tt('summary.noScore', 'Sem placar de quem faltou.')}</p>
        </section>
      )}
      {!plan && isOwner && templates.length > 0 && (
        <button type="button" className="fam-card fam-card--dashed" onClick={() => setSheet('plan')}>
          <span className="fam-eyebrow">{tt('plan.label', 'Plano do grupo')}</span>
          <strong>{tt('plan.choose', 'Escolher um plano de 7 dias')}</strong>
          <span className="fam-note">{tt('plan.chooseHint', 'Uma trilha para ler junto, um dia de cada vez.')}</span>
        </button>
      )}

      {/* ── Mural ── */}
      <section className="fam-section">
        <div className="fam-card__row"><h2 className="fam-section__title">{tt('prayers.title', 'Mural de oração')}</h2><button type="button" className="fam-link" onClick={() => setSheet('prayer')}>{tt('prayers.new', 'Novo pedido')}</button></div>
        {prayers.length === 0 ? <p className="fam-note">{tt('prayers.empty', 'Nenhum pedido ainda. Só o grupo vê.')}</p> : (
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
        <p className="fam-note">{tt('prayers.privacy', 'Só o grupo vê. Quem criou o grupo modera e pode remover qualquer pedido.')}</p>
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
            <label>{tt('prayers.ph', 'Um pedido para o grupo orar')}<textarea rows={4} value={prayerText} onChange={(e) => setPrayerText(e.target.value)} maxLength={280} autoFocus /></label>
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
              {p.coverUrl && <img className="plans__cover" src={p.coverUrl} alt="" loading="lazy" />}
              <h2 className="fam-card__title">{p.title}</h2>
              <p className="fam-card__text">{p.description}</p>
              <p className="fam-note">{tt('plan.days', '{{count}} dias', { count: p.days })} · {p.themeWord}</p>
              <button type="button" className="fam-btn fam-btn--primary" disabled={busy} onClick={() => run(() => FamilyService.setPlan(p.id), apply)}>{tt('plan.start', 'Começar')}</button>
            </div>
          ))}
          {error && <p className="fam-error">{error}</p>}
        </Sheet>
      )}

      {groupSheets}

      {sheet === 'groups' && (
        <Sheet title={tt('groups.title', 'Seus grupos')} onClose={close}>
          <div className="fam-groups">
            {groups.families.map((g) => (
              <button key={g.id} type="button" className={`fam-group${g.id === family.id ? ' is-on' : ''}`} aria-pressed={g.id === family.id}
                onClick={() => { if (g.id !== family.id) activeFamily.set(g.id); close(); }}>
                <span className="fam-group__icon">{g.name.trim().slice(0, 2).toUpperCase()}</span>
                <span className="fam-group__text">
                  <strong>{g.name}</strong>
                  <small>{[g.role === 'owner' ? tt('groups.owner', 'Você criou') : null, tt('groups.adults', '{{count}} adultos', { count: g.members }), g.children > 0 ? tt('groups.kids', '{{count}} crianças', { count: g.children }) : null].filter(Boolean).join(' · ')}</small>
                </span>
                {g.id === family.id && <span aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
          {groups.families.length < groups.max ? (
            <div className="fam-inline fam-inline--actions">
              <button type="button" className="fam-btn fam-btn--secondary" onClick={() => setSheet('create')}>{tt('groups.create', 'Criar outro grupo')}</button>
              <button type="button" className="fam-btn fam-btn--secondary" onClick={() => setSheet('join')}>{tt('groups.join', 'Entrar com código')}</button>
            </div>
          ) : null}
          <p className="fam-note">{tt('groups.count', 'Você está em {{count}} de {{max}} grupos possíveis.', { count: groups.families.length, max: groups.max })}</p>
        </Sheet>
      )}

      {sheet === 'manage' && (
        <Sheet title={tt('manage.title', 'Gerenciar grupo')} onClose={close}>
          {isOwner && (
            <form className="fam-form" onSubmit={(e) => { e.preventDefault(); run(() => FamilyService.update(name.trim() || family.name, meeting.trim()), apply); }}>
              <label>{tt('create.name', 'Nome do grupo')}<input value={name || family.name} onChange={(e) => setName(e.target.value)} maxLength={60} /></label>
              <label>{tt('create.meeting', 'Horário combinado (opcional)')}<input value={meeting || family.meetingTime || ''} onChange={(e) => setMeeting(e.target.value)} maxLength={60} /></label>
              <button type="submit" className="fam-btn fam-btn--secondary" disabled={busy}>{tt('save', 'Salvar')}</button>
            </form>
          )}

          {isOwner && plan && <button type="button" className="fam-btn fam-btn--ghost" disabled={busy} onClick={() => run(() => FamilyService.clearPlan(), setFamily)}>{tt('plan.stop', 'Encerrar o plano atual')}</button>}
          {isOwner && <button type="button" className="fam-btn fam-btn--ghost" disabled={busy} onClick={() => run(() => FamilyService.rotateInvite(), setFamily)}>{tt('invite.new', 'Gerar novo código de convite')}</button>}
          {error && <p className="fam-error">{error}</p>}

          {!confirmLeave ? (
            <button type="button" className="fam-btn fam-btn--danger" onClick={() => setConfirmLeave(true)}>{isOwner ? tt('delete', 'Apagar grupo') : tt('leave', 'Sair do grupo')}</button>
          ) : (
            <div className="fam-confirm">
              <p>{isOwner ? tt('confirmDelete', 'Apagar o grupo? Os adultos saem do grupo e tudo o que foi guardado é apagado, inclusive os apelidos das crianças e o mural.') : tt('confirmLeave', 'Sair deste grupo?')}</p>
              <button type="button" className="fam-btn fam-btn--danger" disabled={busy} onClick={() => run(() => FamilyService.leave(), () => { setPrayers([]); close(); })}>{tt('confirmYes', 'Sim, continuar')}</button>
              <button type="button" className="fam-btn fam-btn--ghost" onClick={() => setConfirmLeave(false)}>{tt('cancel', 'Cancelar')}</button>
            </div>
          )}
        </Sheet>
      )}
    </div>
  );
}

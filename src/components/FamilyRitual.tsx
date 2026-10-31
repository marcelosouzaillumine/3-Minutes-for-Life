import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HtmlRenderer } from './HtmlRenderer';
import { DevotionalService } from '../services/DevotionalService';
import { JourneyService } from '../services/JourneyService';
import { FamilyService, type Band, type Family, type KidsVersion } from '../services/FamilyService';
import { getTodayInSaoPaulo } from '../utils/date';
import { RITUAL_STEPS, guideVersion, parseGuide, readerForDay, versionsForChildren } from '../utils/ritual';
import type { Devotional } from '../types/Devotional';
import '../styles/family.css';
import { Paragraphs } from './Paragraphs';
import { SectionLabel } from './SectionLabel';

/** Ler em família: um roteiro de tela cheia, uma coisa por vez, feito para ser lido em voz alta. */
export function FamilyRitual({ source, onClose }: { source: 'daily' | 'plan'; onClose: () => void }) {
  const { t, i18n } = useTranslation('common');
  const tt: TT = (k, d, o) => t(`ritual.${k}`, typeof d === 'string' ? { defaultValue: d, ...o } : d) as string;

  const [family, setFamily] = useState<Family | null>(null);
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [kids, setKids] = useState<KidsVersion[]>([]);
  const [chosen, setChosen] = useState<'daily' | 'plan'>(source);
  const [present, setPresent] = useState<Set<string>>(new Set());
  const [step, setStep] = useState(0);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => { FamilyService.get().then((f) => {
    setFamily(f);
    setPresent(new Set((f?.children ?? []).map((c) => c.id)));
    setLoaded(true);
  }).catch(() => setFailed(true)); }, []);

  const planDay = family?.plan && !family.plan.completed && !family.plan.lockedUntilTomorrow ? family.plan.days[family.plan.currentDay - 1] : null;
  const canPlan = !!planDay;
  const useSource: 'daily' | 'plan' = chosen === 'plan' && canPlan ? 'plan' : 'daily';

  useEffect(() => {
    if (!family) return;
    let alive = true;
    setDevotional(null);
    const load = useSource === 'plan' && planDay
      ? DevotionalService.getDevotional(planDay.devotionalId, i18n.language)
      : DevotionalService.getDailyDevotional(getTodayInSaoPaulo(), i18n.language);
    load.then(async (d) => {
      if (!alive) return;
      setDevotional(d);
      const v = await FamilyService.getKids(d.id, i18n.language);
      if (alive) setKids(v);
    }).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [family, useSource, planDay?.devotionalId, i18n.language]);

  const adults = useMemo(() => (family?.members ?? []).map((m) => m.displayName ?? '').filter(Boolean), [family]);
  const dayKey = Math.floor(Date.now() / 86_400_000);
  const reader = readerForDay(adults, dayKey);
  const perChild = useMemo(
    () => (family ? versionsForChildren(family.children, present, kids) : []),
    [family, present, kids],
  );

  const guide = useMemo(() => {
    const v = guideVersion(perChild, kids);
    return v ? parseGuide(v.adultGuide) : null;
  }, [perChild, kids]);
  const rawGuide = guideVersion(perChild, kids)?.adultGuide ?? '';

  // Telas: uma por pergunta quando o guia segue o formato; senão uma só tela de conversa.
  const screens = useMemo(() => {
    const out: { id: string; kind: (typeof RITUAL_STEPS)[number]; q?: number }[] = [{ id: 'welcome', kind: 'welcome' }, { id: 'read', kind: 'read' }];
    if (guide) guide.questions.forEach((_, q) => out.push({ id: `talk-${q}`, kind: 'talk', q }));
    else out.push({ id: 'talk', kind: 'talk' });
    out.push({ id: 'do', kind: 'do' }, { id: 'pray', kind: 'pray' }, { id: 'done', kind: 'done' });
    return out;
  }, [guide]);

  const screen = screens[Math.min(step, screens.length - 1)];
  const last = step >= screens.length - 1;

  const finish = async () => {
    if (!devotional) return;
    setSaving(true);
    try {
      await JourneyService.complete(devotional.id, devotional.legacy_id);
      setSaved(true);
      FamilyService.get().then((f) => f && setFamily(f)).catch(() => {});
    } catch { setFailed(true); }
    setSaving(false);
  };

  if (failed && !devotional) {
    return (
      <div className="ritual"><div className="ritual__body">
        <p className="ritual__lead">{tt('error', 'Não foi possível abrir o devocional agora.')}</p>
        <button type="button" className="fam-btn fam-btn--secondary" onClick={onClose}>{tt('close', 'Fechar')}</button>
      </div></div>
    );
  }
  if (!loaded) return <div className="ritual"><div className="ritual__body"><p className="ritual__lead">…</p></div></div>;

  if (!family) return <RitualSetup onClose={onClose} onCreated={(f) => { setFamily(f); setPresent(new Set(f.children.map((c) => c.id))); }} tt={tt} />;
  if (!devotional) return <div className="ritual"><div className="ritual__body"><p className="ritual__lead">…</p></div></div>;

  const guidePanel = rawGuide && (
    <div className="ritual__guide">
      <button type="button" className="fam-btn fam-btn--ghost ritual__guide-toggle" aria-expanded={showGuide} onClick={() => setShowGuide(!showGuide)}>
        {showGuide ? tt('hideGuide', 'Esconder o guia') : tt('howToLead', 'Ver como conduzir')}
      </button>
      {showGuide && <div className="ritual__guide-body">{guide?.lead ? <Paragraphs text={guide.lead} /> : <Paragraphs text={rawGuide} />}</div>}
    </div>
  );

  return (
    <div className="ritual" role="dialog" aria-modal="true" aria-label={tt('title', 'Ler em família')}>
      <header className="ritual__top">
        <div className="ritual__progress" aria-hidden="true">
          {screens.map((s, i) => <i key={s.id} className={i <= step ? 'is-on' : ''} />)}
        </div>
        <button type="button" className="fam-icon-btn" aria-label={tt('close', 'Fechar')} onClick={onClose}>×</button>
      </header>

      <div className="ritual__body">
        {screen.kind === 'welcome' && (
          <>
            <p className="fam-eyebrow fam-eyebrow--accent">{useSource === 'plan' && family.plan ? tt('planDay', 'Plano · dia {{n}}', { n: family.plan.currentDay }) : tt('today', 'Devocional de hoje')}</p>
            <h1 className="ritual__title">{devotional.title}</h1>
            {canPlan && (
              <div className="fam-people" role="tablist">
                <button type="button" className={`fam-chip${useSource === 'daily' ? ' is-on' : ''}`} onClick={() => setChosen('daily')}>{tt('pickDaily', 'Devocional do dia')}</button>
                <button type="button" className={`fam-chip${useSource === 'plan' ? ' is-on' : ''}`} onClick={() => setChosen('plan')}>{tt('pickPlan', 'Do plano · dia {{n}}', { n: family.plan?.currentDay })}</button>
              </div>
            )}
            {family.children.length > 0 && (
              <>
                <p className="ritual__lead">{tt('whoIsHere', 'Quem está à mesa?')}</p>
                <div className="fam-people">
                  {family.children.map((c) => (
                    <button key={c.id} type="button" className="fam-person" aria-pressed={present.has(c.id)}
                      onClick={() => setPresent((p) => { const n = new Set(p); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })}>
                      <span className={`fam-avatar fam-avatar--child${present.has(c.id) ? ' is-read' : ''}`}>{c.nickname.slice(0, 2)}</span>
                      <span className="fam-person__label">{c.nickname}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {family.meetingTime && <p className="fam-note">{tt('meeting', 'Hora combinada: {{time}}', { time: family.meetingTime })}</p>}
          </>
        )}

        {screen.kind === 'read' && (
          <>
            <span className="ritual__tag">{tt('stepRead', '1 · Ler')}</span>
            {reader && <p className="fam-note">{tt('reader', '{{name}} lê em voz alta', { name: reader })}</p>}
            {(devotional.scripture_reference || devotional.scripture_text) && (
              <blockquote className="principle-scripture principle-scripture--ritual">
                {devotional.scripture_reference && <cite className="principle-scripture-reference">{devotional.scripture_reference}</cite>}
                {devotional.scripture_text && <p className="principle-scripture-text">&ldquo;{devotional.scripture_text}&rdquo;</p>}
              </blockquote>
            )}
            {perChild.length > 0 && perChild.some((p) => p.version) ? (
              perChild.map(({ child, version }) => (
                <section key={child.id} className="ritual__kid">
                  <h3>{child.nickname} · {child.band.replace('-', ' a ')} {tt('years', 'anos')}</h3>
                  {version?.title && <p className="ritual__kid-title">{version.title}</p>}
                  {version ? <Paragraphs text={version.whatItSays} /> : <p className="fam-note">{tt('noKids', 'Ainda não há versão para esta faixa. Leia o texto dos adultos e converse.')}</p>}
                </section>
              ))
            ) : (
              <HtmlRenderer html={devotional.reflection} className="ritual__text" />
            )}
          </>
        )}

        {screen.kind === 'talk' && (
          <>
            <span className="ritual__tag">{tt('stepTalk', '2 · Conversar')}</span>
            {guide && screen.q !== undefined ? (
              <>
                <p className="fam-eyebrow">{tt('question', 'Pergunta {{n}} de {{total}}', { n: screen.q + 1, total: guide.questions.length })}</p>
                <div className="ritual__question"><p>{guide.questions[screen.q]}</p></div>
                <p className="fam-note">{tt('questionHint', 'Deixe cada um responder, sem pressa. Quem quiser pode passar.')}</p>
              </>
            ) : (
              <>
                {perChild.filter((p) => p.version).map(({ child, version }) => (
                  <section key={child.id} className="ritual__kid"><h3>{child.nickname}</h3><Paragraphs text={version!.thinkAbout} question /></section>
                ))}
                {!perChild.some((p) => p.version) && devotional.practical_application && <HtmlRenderer html={devotional.practical_application} className="ritual__text" />}
              </>
            )}
            {guidePanel}
          </>
        )}

        {screen.kind === 'do' && (
          <>
            <span className="ritual__tag">{tt('stepDo', '3 · Fazer')}</span>
            {guide ? (
              <>
                <SectionLabel icon="practice">{tt('activity', 'Atividade em família')}</SectionLabel>
                <div className="sec-card"><Paragraphs text={guide.activity} /></div>
              </>
            ) : (
              <>
                {perChild.filter((p) => p.version).map(({ child, version }) => (
                  <section key={child.id} className="ritual__kid"><h3>{child.nickname}</h3><div className="sec-card"><Paragraphs text={version!.practice} strong /></div></section>
                ))}
                {devotional.practical_application && <HtmlRenderer html={devotional.practical_application} className="ritual__text" />}
              </>
            )}
          </>
        )}

        {screen.kind === 'pray' && (
          <>
            <span className="ritual__tag">{tt('stepPray', '4 · Orar')}</span>
            {guide ? (
              <>
                <SectionLabel icon="prayer">{tt('familyPrayer', 'Oração em família')}</SectionLabel>
                <div className="sec-prayer"><Paragraphs text={guide.prayer} /></div>
              </>
            ) : (
              <>
                <SectionLabel icon="prayer">{tt('prayer', 'Oração')}</SectionLabel>
                {devotional.prayer && <HtmlRenderer html={devotional.prayer} className="ritual__text ritual__prayer sec-prayer" />}
                {perChild.filter((p) => p.version?.prayer).map(({ child, version }) => (
                  <section key={child.id} className="ritual__kid"><h3>{child.nickname}</h3><div className="sec-prayer"><Paragraphs text={version!.prayer} /></div></section>
                ))}
              </>
            )}
          </>
        )}

        {screen.kind === 'done' && (
          <>
            <h1 className="ritual__title">{saved ? tt('doneTitle', 'Vocês leram juntos.') : tt('almost', 'Vamos registrar?')}</h1>
            <p className="ritual__lead">{saved ? tt('doneText', 'Cada adulto marca a própria leitura. Obrigado por separar esse tempo.') : tt('markText', 'Isso registra a sua leitura de hoje.')}</p>
            {saved && family.week.streak > 0 && (
              <div className="ritual__streak"><strong>{family.week.streak}</strong><span>{tt('streakDays', { count: family.week.streak, defaultValue: 'dias seguidos em família' })}</span></div>
            )}
            {!saved ? (
              <button type="button" className="fam-btn fam-btn--primary" disabled={saving} onClick={finish}>{tt('together', 'Concluímos juntos')}</button>
            ) : (
              <button type="button" className="fam-btn fam-btn--secondary" onClick={onClose}>{tt('close', 'Fechar')}</button>
            )}
          </>
        )}
      </div>

      {!last && (
        <footer className="ritual__nav">
          <button type="button" className="fam-btn fam-btn--ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>{tt('back', 'Voltar')}</button>
          <button type="button" className="fam-btn fam-btn--primary" onClick={() => setStep(step + 1)}>{tt('next', 'Continuar')}</button>
        </footer>
      )}
    </div>
  );
}

type TT = (k: string, d: string | Record<string, unknown>, o?: Record<string, unknown>) => string;

/** Quem ainda não tem família cria uma aqui mesmo, em dois passos, e segue direto para a leitura. */
function RitualSetup({ onClose, onCreated, tt }: { onClose: () => void; onCreated: (f: Family) => void; tt: TT }) {
  const [stepNo, setStepNo] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [fam, setFam] = useState<Family | null>(null);
  const [nick, setNick] = useState('');
  const [band, setBand] = useState<Band>('7-10');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn: () => Promise<Family>, after: (f: Family) => void) => {
    setBusy(true); setError('');
    try { after(await fn()); } catch { setError(tt('setupError', 'Não foi possível salvar agora. Tente de novo.')); }
    setBusy(false);
  };

  return (
    <div className="ritual" role="dialog" aria-modal="true" aria-label={tt('title', 'Ler em família')}>
      <header className="ritual__top">
        <div className="ritual__progress" aria-hidden="true"><i className="is-on" /><i className={stepNo === 2 ? 'is-on' : ''} /></div>
        <button type="button" className="fam-icon-btn" aria-label={tt('close', 'Fechar')} onClick={onClose}>×</button>
      </header>
      <div className="ritual__body">
        <p className="fam-eyebrow fam-eyebrow--accent">{tt('setupStep', 'Passo {{n}} de 2', { n: stepNo })}</p>
        {stepNo === 1 ? (
          <form className="fam-form" onSubmit={(e) => { e.preventDefault(); if (name.trim()) run(() => FamilyService.create(name.trim()), (f) => { setFam(f); setStepNo(2); }); }}>
            <h1 className="ritual__title">{tt('setupName', 'Como se chama a sua família?')}</h1>
            <label><input value={name} onChange={(e) => setName(e.target.value)} placeholder={tt('setupNamePh', 'Família Souza')} maxLength={60} autoFocus /></label>
            <p className="fam-note">{tt('setupNameNote', 'Os outros adultos entram depois, por um link de convite.')}</p>
            {error && <p className="fam-error">{error}</p>}
            <button type="submit" className="fam-btn fam-btn--primary" disabled={busy || !name.trim()}>{tt('next', 'Continuar')}</button>
          </form>
        ) : (
          <>
            <h1 className="ritual__title">{tt('setupKids', 'Quem lê com você?')}</h1>
            {(fam?.children ?? []).map((c) => (
              <div key={c.id} className="ritual__kid"><h3>{c.nickname}</h3><p>{c.band.replace('-', ' a ')} {tt('years', 'anos')}</p></div>
            ))}
            <form className="fam-inline" onSubmit={(e) => { e.preventDefault(); if (nick.trim()) run(() => FamilyService.addChild(nick.trim(), band), (f) => { setFam(f); setNick(''); }); }}>
              <input value={nick} onChange={(e) => setNick(e.target.value)} placeholder={tt('nickname', 'Apelido')} maxLength={20} aria-label={tt('nickname', 'Apelido')} />
              <select value={band} onChange={(e) => setBand(e.target.value as Band)} aria-label={tt('band', 'Faixa de idade')}>
                {(['4-6', '7-10', '11-13'] as Band[]).map((b) => <option key={b} value={b}>{b.replace('-', ' a ')} {tt('years', 'anos')}</option>)}
              </select>
              <button type="submit" className="fam-btn fam-btn--secondary" disabled={busy || !nick.trim()}>{tt('addChild', 'Adicionar criança')}</button>
            </form>
            <p className="fam-note">{tt('setupKidsNote', 'Só apelido e faixa de idade. Sem sobrenome, foto ou e-mail.')}</p>
            {error && <p className="fam-error">{error}</p>}
            <button type="button" className="fam-btn fam-btn--primary" disabled={busy || !fam} onClick={() => fam && onCreated(fam)}>{tt('setupStart', 'Começar a leitura')}</button>
          </>
        )}
      </div>
    </div>
  );
}

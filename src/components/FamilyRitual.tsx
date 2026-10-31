import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HtmlRenderer } from './HtmlRenderer';
import { DevotionalService } from '../services/DevotionalService';
import { JourneyService } from '../services/JourneyService';
import { FamilyService, type Band, type Family, type KidsVersion } from '../services/FamilyService';
import { getTodayInSaoPaulo } from '../utils/date';
import { guideVersion, htmlBlocks, paginate, parseGuide, plainBlocks, readerForDay, versionsForChildren } from '../utils/ritual';
import type { Devotional } from '../types/Devotional';
import '../styles/family.css';
import { Paragraphs } from './Paragraphs';
import { SectionLabel } from './SectionLabel';

/** Ler juntos: um roteiro de tela cheia, uma coisa por vez, feito para ser lido em voz alta. */
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
  const bodyRef = useRef<HTMLDivElement>(null);
  const [audience, setAudience] = useState<'adults' | 'kids'>(() => {
    try { return localStorage.getItem('ritual.audience') === 'adults' ? 'adults' : 'kids'; } catch { return 'kids'; }
  });

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
  // Uma só escolha de público conduz todas as telas: com crianças, tudo vem da faixa delas; só adultos, do texto adulto.
  const withKids = audience === 'kids' && (family?.children.length ?? 0) > 0;
  const perChild = useMemo(
    () => (family && withKids ? versionsForChildren(family.children, present, kids) : []),
    [family, withKids, present, kids],
  );
  const leadVersion = useMemo(() => (withKids ? guideVersion(perChild, []) : null), [withKids, perChild]);

  const guide = useMemo(() => (leadVersion ? parseGuide(leadVersion.adultGuide) : null), [leadVersion]);
  const rawGuide = leadVersion?.adultGuide ?? '';

  // Perguntas da mesa: as do guia; sem guia, as do "Para pensar" da faixa; sem nada disso (ou só adultos), perguntas gerais.
  const questions = useMemo(() => {
    if (guide) return guide.questions;
    const own = (leadVersion?.thinkAbout ?? '').split(/\r?\n/).map((l) => l.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim()).filter((l) => l.endsWith('?'));
    if (own.length) return own;
    const edited = (devotional?.discussion_questions ?? '').split(/\r?\n/).map((l) => l.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim()).filter(Boolean);
    return edited.length ? edited : [
      tt('adultQ1', 'O que mais chamou a sua atenção no texto de hoje?'),
      tt('adultQ2', 'Onde isso toca a sua semana, de verdade?'),
      tt('adultQ3', 'O que você leva dessa leitura para hoje?'),
    ];
  }, [guide, leadVersion, devotional, i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickAudience = (a: 'adults' | 'kids') => {
    setAudience(a);
    try { localStorage.setItem('ritual.audience', a); } catch { /* sem armazenamento */ }
  };

  const kidsView = perChild.some((p) => p.version);

  // Textos longos se dividem em partes curtas, uma ideia por tela.
  const readKids = useMemo(() => perChild.map(({ child, version }) => ({ child, version, pages: paginate(plainBlocks(version?.whatItSays)) })), [perChild]);
  const readAdult = useMemo(() => paginate(htmlBlocks(devotional?.reflection)), [devotional]);
  const readCount = Math.max(1, kidsView ? Math.max(...readKids.map((k) => k.pages.length)) : readAdult.length);

  const doGuide = useMemo(() => paginate(plainBlocks(guide?.activity)), [guide]);
  const doAdult = useMemo(() => paginate(htmlBlocks(devotional?.practical_application)), [devotional]);
  const doCount = Math.max(1, guide ? doGuide.length : kidsView ? 1 : doAdult.length);

  // Telas: ler (em partes), uma por pergunta, fazer (em partes), orar.
  const screens = useMemo(() => {
    type S = { id: string; kind: 'welcome' | 'read' | 'talk' | 'do' | 'pray' | 'done'; q?: number; part?: number };
    const out: S[] = [{ id: 'welcome', kind: 'welcome' }];
    for (let i = 0; i < readCount; i++) out.push({ id: `read-${i}`, kind: 'read', part: i });
    questions.forEach((_, q) => out.push({ id: `talk-${q}`, kind: 'talk', q }));
    for (let i = 0; i < doCount; i++) out.push({ id: `do-${i}`, kind: 'do', part: i });
    out.push({ id: 'pray', kind: 'pray' }, { id: 'done', kind: 'done' });
    return out;
  }, [questions, readCount, doCount]);

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
    <div className={`ritual${screen.kind === 'pray' ? ' ritual--pray' : ''}`} role="dialog" aria-modal="true" aria-label={tt('title', 'Ler juntos')}>
      <header className="ritual__top">
        <div className="ritual__progress" aria-hidden="true">
          {screens.map((s, i) => <i key={s.id} className={i <= step ? 'is-on' : ''} />)}
        </div>
        <button type="button" className="fam-icon-btn" aria-label={tt('close', 'Fechar')} onClick={onClose}>×</button>
      </header>

      <div className="ritual__body" ref={bodyRef}>
        <div className="ritual__screen" key={screen.id}>
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
            {devotional.scripture_reference && <p className="ritual__verse">{devotional.scripture_reference}</p>}
            {devotional.principle_statement && <p className="ritual__lead">{devotional.principle_statement}</p>}
            <p className="fam-note">{tt('promise', '3 minutos · ler, conversar, fazer e orar juntos')}</p>
            <p className="ritual__lead">{tt('withWhom', 'Com quem você vai ler hoje?')}</p>
            <div className="fam-people" role="group" aria-label={tt('withWhom', 'Com quem você vai ler hoje?')}>
              <button type="button" className={`fam-chip${!withKids ? ' is-on' : ''}`} aria-pressed={!withKids} onClick={() => pickAudience('adults')}>{tt('onlyAdults', 'Só adultos')}</button>
              {family.children.length > 0 && (
                <button type="button" className={`fam-chip${withKids ? ' is-on' : ''}`} aria-pressed={withKids} onClick={() => pickAudience('kids')}>{tt('withKids', 'Com crianças')}</button>
              )}
            </div>
            {family.children.length === 0 && <p className="fam-note">{tt('noKidsHint', 'Casal, grupo ou sozinho: a leitura funciona do mesmo jeito. Para ler com crianças, cadastre-as em Família.')}</p>}
            {withKids && (
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
            {readCount > 1 && <p className="fam-note">{tt('part', 'Parte {{n}} de {{total}}', { n: (screen.part ?? 0) + 1, total: readCount })}</p>}
            {screen.part === 0 && (
              <>
                {reader && <p className="fam-note">{tt('reader', '{{name}} lê em voz alta', { name: reader })}</p>}
                {(devotional.scripture_reference || devotional.scripture_text) && (
                  <blockquote className="principle-scripture principle-scripture--ritual">
                    {devotional.scripture_reference && <cite className="principle-scripture-reference">{devotional.scripture_reference}</cite>}
                    {devotional.scripture_text && <p className="principle-scripture-text">&ldquo;{devotional.scripture_text}&rdquo;</p>}
                  </blockquote>
                )}
              </>
            )}
            {kidsView ? (
              readKids.filter((k) => k.pages[screen.part ?? 0]).map(({ child, version, pages }) => (
                <section key={child.id} className="ritual__kid">
                  <h3>{child.nickname} · {child.band.replace('-', ' a ')} {tt('years', 'anos')}</h3>
                  {screen.part === 0 && version?.title && <p className="ritual__kid-title">{version.title}</p>}
                  <Paragraphs text={pages[screen.part ?? 0].join('\n\n')} />
                </section>
              ))
            ) : (
              <HtmlRenderer html={(readAdult[screen.part ?? 0] ?? []).join('\n')} className="ritual__text" />
            )}
          </>
        )}

        {screen.kind === 'talk' && screen.q !== undefined && (
          <>
            <span className="ritual__tag">{tt('stepTalk', '2 · Conversar')}</span>
            <p className="fam-eyebrow">{tt('question', 'Pergunta {{n}} de {{total}}', { n: screen.q + 1, total: questions.length })}</p>
            <div className="ritual__question"><p>{questions[screen.q]}</p></div>
            <p className="fam-note">{tt('questionHint', 'Deixe cada um responder, sem pressa. Quem quiser pode passar.')}</p>
            {guidePanel}
          </>
        )}

        {screen.kind === 'do' && (
          <>
            <span className="ritual__tag">{tt('stepDo', '3 · Fazer')}</span>
            {doCount > 1 && <p className="fam-note">{tt('part', 'Parte {{n}} de {{total}}', { n: (screen.part ?? 0) + 1, total: doCount })}</p>}
            {guide ? (
              <>
                {screen.part === 0 && <SectionLabel icon="practice">{tt('activity', 'Atividade em família')}</SectionLabel>}
                <div className="sec-card"><Paragraphs text={(doGuide[screen.part ?? 0] ?? []).join('\n\n')} /></div>
              </>
            ) : kidsView ? (
              perChild.filter((p) => p.version).map(({ child, version }) => (
                <section key={child.id} className="ritual__kid"><h3>{child.nickname}</h3><div className="sec-card"><Paragraphs text={version!.practice} strong /></div></section>
              ))
            ) : (
              <>
                {screen.part === 0 && <SectionLabel icon="practice">{tt('doToday', 'Para viver hoje')}</SectionLabel>}
                <HtmlRenderer html={(doAdult[screen.part ?? 0] ?? []).join('\n')} className="ritual__text" />
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
            ) : kidsView ? (
              <>
                <SectionLabel icon="prayer">{tt('prayer', 'Oração')}</SectionLabel>
                {perChild.filter((p) => p.version?.prayer).map(({ child, version }) => (
                  <section key={child.id} className="ritual__kid"><h3>{child.nickname}</h3><div className="sec-prayer"><Paragraphs text={version!.prayer} /></div></section>
                ))}
              </>
            ) : (
              <>
                <SectionLabel icon="prayer">{tt('prayer', 'Oração')}</SectionLabel>
                {devotional.prayer && <HtmlRenderer html={devotional.prayer} className="ritual__text ritual__prayer sec-prayer" />}
              </>
            )}
            <p className="fam-note ritual__amen">{tt('prayHint', 'Respirem fundo, façam silêncio por um instante e orem juntos.')}</p>
          </>
        )}

        {screen.kind === 'done' && (
          <div className="ritual__done">
            <span className="ritual__seal" aria-hidden="true">✓</span>
            <h1 className="ritual__title">{saved ? tt('doneTitle', 'Vocês leram juntos.') : tt('almost', 'Vamos registrar?')}</h1>
            <p className="ritual__lead">{saved ? tt('doneText', 'Cada adulto marca a própria leitura. Obrigado por separar esse tempo.') : tt('markText', 'Isso registra a sua leitura de hoje.')}</p>
            {saved && family.week.streak > 0 && (
              <div className="ritual__streak"><strong>{family.week.streak}</strong><span>{tt('streakDays', { count: family.week.streak, defaultValue: 'dias seguidos juntos' })}</span></div>
            )}
            {saved && <p className="fam-note">{tt('tomorrow', 'Amanhã tem um novo devocional esperando por vocês.')}</p>}
            {!saved ? (
              <button type="button" className="fam-btn fam-btn--primary" disabled={saving} onClick={finish}>{tt('together', 'Concluímos juntos')}</button>
            ) : (
              <button type="button" className="fam-btn fam-btn--secondary" onClick={onClose}>{tt('close', 'Fechar')}</button>
            )}
          </div>
        )}
        </div>
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

/** Quem ainda não tem uma leitura configurada escolhe com quem lê; só crianças pedem mais um passo. */
function RitualSetup({ onClose, onCreated, tt }: { onClose: () => void; onCreated: (f: Family) => void; tt: TT }) {
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
  const create = (after: (f: Family) => void) => run(() => FamilyService.create(tt('setupDefaultName', 'Nossa leitura')), after);

  return (
    <div className="ritual" role="dialog" aria-modal="true" aria-label={tt('title', 'Ler juntos')}>
      <header className="ritual__top">
        <div className="ritual__progress" aria-hidden="true"><i className="is-on" /><i className={fam ? 'is-on' : ''} /></div>
        <button type="button" className="fam-icon-btn" aria-label={tt('close', 'Fechar')} onClick={onClose}>×</button>
      </header>
      <div className="ritual__body">
        {!fam ? (
          <>
            <h1 className="ritual__title">{tt('setupWho', 'Com quem você vai ler?')}</h1>
            <div className="ritual__choices">
              <button type="button" className="ritual__choice" disabled={busy} onClick={() => create(onCreated)}>
                <strong>{tt('setupAdults', 'Só adultos')}</strong>
                <span>{tt('setupAdultsNote', 'Sozinho, em casal ou em grupo')}</span>
              </button>
              <button type="button" className="ritual__choice" disabled={busy} onClick={() => create(setFam)}>
                <strong>{tt('setupWithKids', 'Com crianças')}</strong>
                <span>{tt('setupWithKidsNote', 'Cada uma com a leitura da sua idade')}</span>
              </button>
            </div>
            {error && <p className="fam-error">{error}</p>}
          </>
        ) : (
          <>
            <h1 className="ritual__title">{tt('setupKids', 'Quais crianças leem com você?')}</h1>
            {fam.children.map((c) => (
              <div key={c.id} className="ritual__kid"><h3>{c.nickname}</h3><p>{c.band.replace('-', ' a ')} {tt('years', 'anos')}</p></div>
            ))}
            <form className="fam-inline" onSubmit={(e) => { e.preventDefault(); if (nick.trim()) run(() => FamilyService.addChild(nick.trim(), band), (f) => { setFam(f); setNick(''); }); }}>
              <input value={nick} onChange={(e) => setNick(e.target.value)} placeholder={tt('nickname', 'Apelido')} maxLength={20} aria-label={tt('nickname', 'Apelido')} autoFocus />
              <select value={band} onChange={(e) => setBand(e.target.value as Band)} aria-label={tt('band', 'Faixa de idade')}>
                {(['4-6', '7-10', '11-13'] as Band[]).map((b) => <option key={b} value={b}>{b.replace('-', ' a ')} {tt('years', 'anos')}</option>)}
              </select>
              <button type="submit" className="fam-btn fam-btn--secondary" disabled={busy || !nick.trim()}>{tt('addChild', 'Adicionar criança')}</button>
            </form>
            <p className="fam-note">{tt('setupKidsNote', 'Só apelido e faixa de idade. Sem sobrenome, foto ou e-mail.')}</p>
            {error && <p className="fam-error">{error}</p>}
            <button type="button" className="fam-btn fam-btn--primary" disabled={busy} onClick={() => onCreated(fam)}>{tt('setupStart', 'Começar a leitura')}</button>
          </>
        )}
      </div>
    </div>
  );
}

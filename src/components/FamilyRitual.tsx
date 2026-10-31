import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HtmlRenderer } from './HtmlRenderer';
import { DevotionalService } from '../services/DevotionalService';
import { JourneyService } from '../services/JourneyService';
import { FamilyService, type Band, type Family, type KidsVersion } from '../services/FamilyService';
import { getTodayInSaoPaulo } from '../utils/date';
import { htmlBlocks, pageBudget, paginate, paginateFit, parseGuide, plainBlocks, readerForDay, versionsForChildren } from '../utils/ritual';
import type { Devotional } from '../types/Devotional';
import '../styles/family.css';
import { Paragraphs } from './Paragraphs';
import { SectionLabel } from './SectionLabel';

/** Ler juntos: um roteiro de tela cheia, uma coisa por vez, feito para ser lido em voz alta. */
const bandArt = (band: string) => (band === '4-6' ? 'young' : 'older');

export function FamilyRitual({ source, onClose }: { source: 'daily' | 'plan'; onClose: () => void }) {
  const { t, i18n } = useTranslation('common');
  const tt: TT = (k, d, o) => t(`ritual.${k}`, typeof d === 'string' ? { defaultValue: d, ...o } : d) as string;

  const [family, setFamily] = useState<Family | null>(null);
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [kids, setKids] = useState<KidsVersion[]>([]);
  const [chosen, setChosen] = useState<'daily' | 'plan'>(source);
  const [present, setPresent] = useState<Set<string>>(new Set());
  const [presentAdults, setPresentAdults] = useState<Set<number>>(new Set());
  const [kidNick, setKidNick] = useState('');
  const [kidBand, setKidBand] = useState<Band>('7-10');
  const [kidBusy, setKidBusy] = useState(false);
  const [kidError, setKidError] = useState('');
  const [step, setStep] = useState(0);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  // Escolha guardada; sem escolha, abre em "Com crianças" só se já houver crianças cadastradas.
  const [picked, setAudience] = useState<'adults' | 'kids' | null>(() => {
    try { const v = localStorage.getItem('ritual.audience'); return v === 'adults' || v === 'kids' ? v : null; } catch { return null; }
  });
  const audience: 'adults' | 'kids' = picked ?? ((family?.children.length ?? 0) > 0 ? 'kids' : 'adults');

  useEffect(() => { FamilyService.get().then((f) => {
    setFamily(f);
    setPresent(new Set((f?.children ?? []).map((c) => c.id)));
    setPresentAdults(new Set((f?.members ?? []).map((_, i) => i)));
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

  const adults = useMemo(() => (family?.members ?? []).filter((_, i) => presentAdults.has(i)).map((m) => m.displayName ?? '').filter(Boolean), [family, presentAdults]);
  const dayKey = Math.floor(Date.now() / 86_400_000);
  const reader = readerForDay(adults, dayKey);
  // Uma só escolha de público conduz todas as telas: com crianças, tudo vem da faixa delas; só adultos, do texto adulto.
  const withKids = audience === 'kids' && (family?.children.length ?? 0) > 0;
  const perChild = useMemo(
    () => (family && withKids ? versionsForChildren(family.children, present, kids) : []),
    [family, withKids, present, kids],
  );
  // Uma só leitura para a mesa: todos ouvem o mesmo texto, na faixa da criança mais nova presente (ou a que o adulto escolher).
  const order = ['4-6', '7-10', '11-13'];
  const [leadBand, setLeadBand] = useState<Band | null>(null);
  const bandsHere = useMemo(
    () => [...new Set(perChild.filter((p) => p.version).map((p) => p.version!.band))].sort((a, b) => order.indexOf(a) - order.indexOf(b)),
    [perChild], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const sharedBand = leadBand && bandsHere.includes(leadBand) ? leadBand : bandsHere[0] ?? null;
  const shared = useMemo(() => {
    const v = perChild.find((p) => p.version?.band === sharedBand)?.version;
    if (!v) return [];
    const names = perChild.filter((p) => p.version).map((p) => p.child.nickname).join(', ');
    return [{ child: { id: 'shared', nickname: names, band: v.band as Band }, version: v }];
  }, [perChild, sharedBand]);
  const leadVersion = shared[0]?.version ?? null;

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

  const kidsView = shared.length > 0;
  const budget = useMemo(() => pageBudget(window.innerWidth, window.innerHeight), []);

  // Mede o espaço real da tela: cada parte leva o que cabe, sem sobrar um vazio enorme nem passar do limite.
  const [fitCfg, setFitCfg] = useState<{ h: number; measure: (html: string) => number } | null>(null);
  useLayoutEffect(() => {
    const host = bodyRef.current;
    if (!host?.parentElement || host.clientHeight === 0) return;
    const m = document.createElement('div');
    m.className = 'ritual__body';
    m.setAttribute('aria-hidden', 'true');
    host.parentElement.appendChild(m);
    const update = () => {
      m.style.cssText = `position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;width:${host.clientWidth}px;height:auto;flex:none;overflow:visible;`;
      setFitCfg({ h: host.clientHeight, measure: (html) => { m.innerHTML = html; return m.scrollHeight; } });
    };
    update();
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('resize', update); m.remove(); };
  }, [loaded, family, devotional]);

  const slack = 12;
  const tagHtml = (n: string, kind: string) => `<span class="ritual__tag ritual__tag--${kind}">${esc(n)}</span>`;
  const heroHtml = (band?: string) => (band ? `<div class="ritual__hero ritual__hero--${bandArt(band)}"></div>` : '');
  const verseHtml = () => (reader ? `<p class="fam-note">${esc(tt('reader', '{{name}} lê em voz alta', { name: reader }))}</p>` : '')
    + (devotional && (devotional.scripture_reference || devotional.scripture_text)
      ? `<blockquote class="principle-scripture principle-scripture--ritual">${devotional.scripture_reference ? `<cite class="principle-scripture-reference">${esc(devotional.scripture_reference)}</cite>` : ''}${devotional.scripture_text ? `<p class="principle-scripture-text">“${esc(devotional.scripture_text)}”</p>` : ''}</blockquote>`
      : '');
  const label = '<div style="height:28px"></div>';
  const plainHtml = (blocks: string[]) => blocks.map((x) => `<p>${esc(x)}</p>`).join('');
  type Fit = (page: string[], i: number) => boolean;
  const screenFits = (head: (first: boolean) => string, body: (page: string[]) => string): Fit | null =>
    fitCfg ? (page, i) => fitCfg.measure(`<div class="ritual__screen">${head(i === 0)}${body(page)}</div>`) <= fitCfg.h - slack : null;
  const run = (blocks: string[], fits: Fit | null, first = false) => (fits ? paginateFit(blocks, fits) : paginate(blocks, budget.max, first ? budget.first : budget.max));

  // Textos longos se dividem em partes, uma ideia por tela.
  const nKids = 1;
  const readKids = useMemo(() => shared.map(({ child, version }) => {
    const head = (first: boolean) => (first ? heroHtml(child.band) : '') + tagHtml(tt('stepRead', '1 · Ler'), 'read') + (first ? verseHtml() : '');
    const fits: Fit | null = fitCfg ? (page, i) => {
      const base = fitCfg.measure(`<div class="ritual__screen">${head(i === 0)}</div>`);
      const sec = `<section class="ritual__kid"><h3>${esc(child.nickname)} · ${esc(child.band)} anos</h3>${i === 0 && version?.title ? `<p class="ritual__kid-title">${esc(version.title)}</p>` : ''}${plainHtml(page)}</section>`;
      return fitCfg.measure(`<div class="ritual__screen">${head(i === 0)}${sec}</div>`) <= base + (fitCfg.h - base) / nKids - slack;
    } : null;
    return { child, version, pages: run(plainBlocks(version?.whatItSays), fits, true) };
  }), [shared, budget, fitCfg, reader, devotional, nKids]); // eslint-disable-line react-hooks/exhaustive-deps
  const readAdult = useMemo(() => run(htmlBlocks(devotional?.reflection), screenFits((f) => tagHtml(tt('stepRead', '1 · Ler'), 'read') + (f ? verseHtml() : ''), (pg) => `<div class="ritual__text">${pg.join('')}</div>`), true), [devotional, budget, fitCfg, reader]); // eslint-disable-line react-hooks/exhaustive-deps
  const readCount = Math.max(1, kidsView ? Math.max(...readKids.map((k) => k.pages.length)) : readAdult.length);

  const doHead = (f: boolean) => tagHtml(tt('stepDo', '3 · Fazer'), 'do') + (f ? label : '');
  const doGuide = useMemo(() => run(plainBlocks(guide?.activity), screenFits(doHead, (pg) => `<div class="sec-card">${plainHtml(pg)}</div>`)), [guide, budget, fitCfg]); // eslint-disable-line react-hooks/exhaustive-deps
  const doAdult = useMemo(() => run(htmlBlocks(devotional?.practical_application), screenFits(doHead, (pg) => `<div class="ritual__text">${pg.join('')}</div>`)), [devotional, budget, fitCfg]); // eslint-disable-line react-hooks/exhaustive-deps
  const doCount = Math.max(1, guide ? doGuide.length : kidsView ? 1 : doAdult.length);

  const prayHead = (f: boolean) => tagHtml(tt('stepPray', '4 · Orar'), 'pray') + (f ? label : '');
  const prayGuide = useMemo(() => run(plainBlocks(guide?.prayer), screenFits(prayHead, (pg) => `<div class="ritual--pray"><div class="sec-prayer">${plainHtml(pg)}</div></div>`)), [guide, budget, fitCfg]); // eslint-disable-line react-hooks/exhaustive-deps
  const prayAdult = useMemo(() => run(htmlBlocks(devotional?.prayer), screenFits(prayHead, (pg) => `<div class="ritual--pray"><div class="ritual__text ritual__prayer sec-prayer">${pg.join('')}</div></div>`)), [devotional, budget, fitCfg]); // eslint-disable-line react-hooks/exhaustive-deps
  const prayCount = Math.max(1, guide ? prayGuide.length : kidsView ? 1 : prayAdult.length);

  // Telas: ler (em partes), uma por pergunta, fazer (em partes), orar.
  const screens = useMemo(() => {
    type S = { id: string; kind: 'welcome' | 'read' | 'talk' | 'do' | 'pray' | 'done'; q?: number; part?: number };
    const out: S[] = [{ id: 'welcome', kind: 'welcome' }];
    for (let i = 0; i < readCount; i++) out.push({ id: `read-${i}`, kind: 'read', part: i });
    questions.forEach((_, q) => out.push({ id: `talk-${q}`, kind: 'talk', q }));
    for (let i = 0; i < doCount; i++) out.push({ id: `do-${i}`, kind: 'do', part: i });
    for (let i = 0; i < prayCount; i++) out.push({ id: `pray-${i}`, kind: 'pray', part: i });
    out.push({ id: 'done', kind: 'done' });
    return out;
  }, [questions, readCount, doCount, prayCount]);

  const screen = screens[Math.min(step, screens.length - 1)];
  const last = step >= screens.length - 1;

  // Trocar de tela: círculos no rodapé, deslizar o dedo (gesto horizontal e deliberado) ou setas do teclado.
  // Na primeira tela (escolha do público) e na última (registro) só os botões da própria tela valem.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const go = (delta: number) => setStep((s) => Math.max(0, Math.min(screens.length - 1, s + delta)));
  useEffect(() => {
    if (step === 0 || last) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, last, screens.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; },
    onTouchEnd: (e: React.TouchEvent) => {
      const t = touch.current;
      touch.current = null;
      if (!t || step === 0 || last) return;
      const dx = e.changedTouches[0].clientX - t.x;
      const dy = e.changedTouches[0].clientY - t.y;
      if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
    },
  };

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
    <div className={`ritual${screen.kind === 'pray' ? ' ritual--pray' : ''}`} role="dialog" aria-modal="true" aria-label={tt('title', 'Ler juntos')} {...swipe}>
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
            <section className="ritual__who" aria-label={tt('withWhom', 'Com quem você vai ler hoje?')}>
              <h2 className="ritual__who-title">{tt('withWhom', 'Com quem você vai ler hoje?')}</h2>
              <div className="ritual__choices">
                <button type="button" className={`ritual__choice${audience === 'adults' ? ' is-on' : ''}`} aria-pressed={audience === 'adults'} onClick={() => pickAudience('adults')}>
                  <strong>{tt('onlyAdults', 'Só adultos')}</strong>
                  <span>{tt('setupAdultsNote', 'Sozinho, em casal ou em grupo')}</span>
                </button>
                <button type="button" className={`ritual__choice${audience === 'kids' ? ' is-on' : ''}`} aria-pressed={audience === 'kids'} onClick={() => pickAudience('kids')}>
                  <strong>{tt('withKids', 'Com crianças')}</strong>
                  <span>{tt('setupWithKidsNote', 'Cada uma com a leitura da sua idade')}</span>
                </button>
              </div>
            </section>
            <section className="ritual__kids-box">
              <h3 className="ritual__who-sub">{tt('whoIsHere', 'Quem está à mesa?')}</h3>
              <div className="fam-people">
                {family.members.map((m, i) => (
                  <button key={`a${i}`} type="button" className="fam-person" aria-pressed={presentAdults.has(i)}
                    onClick={() => setPresentAdults((p) => { const n = new Set(p); if (n.has(i)) n.delete(i); else n.add(i); return n; })}>
                    <span className={`fam-avatar${presentAdults.has(i) ? ' is-read' : ''}`}>{(m.displayName ?? '?').trim().slice(0, 2)}</span>
                    <span className="fam-person__label">{m.isMe ? tt('you', 'você') : m.displayName ?? tt('someone', 'Alguém')}</span>
                  </button>
                ))}
                {audience === 'kids' && family.children.map((c) => (
                  <button key={c.id} type="button" className="fam-person" aria-pressed={present.has(c.id)}
                    onClick={() => setPresent((p) => { const n = new Set(p); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })}>
                    <span className={`fam-avatar fam-avatar--child${present.has(c.id) ? ' is-read' : ''}`}>{c.nickname.slice(0, 2)}</span>
                    <span className="fam-person__label">{c.nickname}</span>
                  </button>
                ))}
              </div>
              {reader && <p className="fam-note">{tt('reader', '{{name}} lê em voz alta', { name: reader })}</p>}
              {audience === 'kids' && bandsHere.length > 1 && (
                <>
                  <h3 className="ritual__who-sub">{tt('sharedVersion', 'Todos ouvem a mesma leitura. Qual versão?')}</h3>
                  <div className="ritual__bands">
                    {bandsHere.map((b) => (
                      <button key={b} type="button" className={`ritual__band${b === sharedBand ? ' is-on' : ''}`} aria-pressed={b === sharedBand} onClick={() => setLeadBand(b)}>
                        <span className={`ritual__hero ritual__hero--${bandArt(b)} ritual__hero--thumb`} />
                        <b>{b.replace('-', ' a ')} {tt('years', 'anos')}</b>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {audience === 'kids' && (
                <>
                  <h3 className="ritual__who-sub">{family.children.length > 0 ? tt('addAnother', 'Adicionar outra criança') : tt('addFirst', 'Quem vai ler com você?')}</h3>
                  <form className="fam-inline" onSubmit={async (e) => {
                    e.preventDefault();
                    if (!kidNick.trim() || kidBusy) return;
                    setKidBusy(true); setKidError('');
                    try {
                      const before = new Set(family.children.map((c) => c.id));
                      const f = await FamilyService.addChild(kidNick.trim(), kidBand);
                      setFamily(f);
                      setPresent((p) => { const n = new Set(p); f.children.filter((c) => !before.has(c.id)).forEach((c) => n.add(c.id)); return n; });
                      setKidNick('');
                    } catch { setKidError(tt('setupError', 'Não foi possível salvar agora. Tente de novo.')); }
                    setKidBusy(false);
                  }}>
                    <input value={kidNick} onChange={(e) => setKidNick(e.target.value)} placeholder={tt('nickname', 'Apelido')} maxLength={20} aria-label={tt('nickname', 'Apelido')} />
                    <select value={kidBand} onChange={(e) => setKidBand(e.target.value as Band)} aria-label={tt('band', 'Faixa de idade')}>
                      {(['4-6', '7-10', '11-13'] as Band[]).map((b) => <option key={b} value={b}>{b.replace('-', ' a ')} {tt('years', 'anos')}</option>)}
                    </select>
                    <button type="submit" className="fam-btn fam-btn--secondary" disabled={kidBusy || !kidNick.trim()}>{tt('addChild', 'Adicionar criança')}</button>
                  </form>
                  {kidError && <p className="fam-error">{kidError}</p>}
                  <p className="fam-note">{tt('addOnceNote', 'Leitura de um dia só, na igreja por exemplo? Cadastre a criança aqui e remova depois em Grupo.')}</p>
                </>
              )}
            </section>
            {family.meetingTime && <p className="fam-note">{tt('meeting', 'Hora combinada: {{time}}', { time: family.meetingTime })}</p>}
          </>
        )}

        {screen.kind === 'read' && (
          <>
            {screen.part === 0 && kidsView && <div className={`ritual__hero ritual__hero--${bandArt(shared[0].child.band)}`} />}
            <span className="ritual__tag ritual__tag--read">{tt('stepRead', '1 · Ler')}</span>
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
            <span className="ritual__tag ritual__tag--talk">{tt('stepTalk', '2 · Conversar')}</span>
            <p className="fam-eyebrow">{tt('question', 'Pergunta {{n}} de {{total}}', { n: screen.q + 1, total: questions.length })}</p>
            <div className="ritual__question"><p>{questions[screen.q]}</p></div>
            <p className="fam-note">{tt('questionHint', 'Deixe cada um responder, sem pressa. Quem quiser pode passar.')}</p>
            {guidePanel}
          </>
        )}

        {screen.kind === 'do' && (
          <>
            <span className="ritual__tag ritual__tag--do">{tt('stepDo', '3 · Fazer')}</span>
            {guide ? (
              <>
                {screen.part === 0 && <SectionLabel icon="practice">{tt('activity', 'Atividade em família')}</SectionLabel>}
                <div className="sec-card"><Paragraphs text={(doGuide[screen.part ?? 0] ?? []).join('\n\n')} /></div>
              </>
            ) : kidsView ? (
              shared.map(({ child, version }) => (
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
            <span className="ritual__tag ritual__tag--pray">{tt('stepPray', '4 · Orar')}</span>
            {guide ? (
              <>
                {screen.part === 0 && <SectionLabel icon="prayer">{tt('familyPrayer', 'Oração em família')}</SectionLabel>}
                <div className="sec-prayer"><Paragraphs text={(prayGuide[screen.part ?? 0] ?? []).join('\n\n')} /></div>
              </>
            ) : kidsView ? (
              <>
                <SectionLabel icon="prayer">{tt('prayer', 'Oração')}</SectionLabel>
                {shared.filter((p) => p.version?.prayer).map(({ child, version }) => (
                  <section key={child.id} className="ritual__kid"><h3>{child.nickname}</h3><div className="sec-prayer"><Paragraphs text={version!.prayer} /></div></section>
                ))}
              </>
            ) : (
              <>
                {screen.part === 0 && <SectionLabel icon="prayer">{tt('prayer', 'Oração')}</SectionLabel>}
                <HtmlRenderer html={(prayAdult[screen.part ?? 0] ?? []).join('\n')} className="ritual__text ritual__prayer sec-prayer" />
              </>
            )}
            {(screen.part ?? 0) >= prayCount - 1 && <p className="fam-note ritual__amen">{tt('prayHint', 'Respirem fundo, façam silêncio por um instante e orem juntos.')}</p>}
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

      {!last && (step === 0 ? (
        <footer className="ritual__nav">
          <button type="button" className="fam-btn fam-btn--primary" onClick={() => go(1)}>{tt('start', 'Começar')}</button>
        </footer>
      ) : (
        <footer className="ritual__nav ritual__nav--circles">
          <button type="button" className="ritual__circle" aria-label={tt('back', 'Voltar')} onClick={() => go(-1)}>‹</button>
          <span className="ritual__counter" aria-live="polite">{tt('counter', '{{n}} de {{total}}', { n: step, total: screens.length - 1 })}</span>
          <button type="button" className="ritual__circle ritual__circle--next" aria-label={tt('next', 'Continuar')} onClick={() => go(1)}>›</button>
        </footer>
      ))}
    </div>
  );
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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

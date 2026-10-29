import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HtmlRenderer } from './HtmlRenderer';
import { DevotionalService } from '../services/DevotionalService';
import { JourneyService } from '../services/JourneyService';
import { FamilyService, type Family, type KidsVersion } from '../services/FamilyService';
import { getTodayInSaoPaulo } from '../utils/date';
import { RITUAL_STEPS, readerForDay, versionsForChildren } from '../utils/ritual';
import type { Devotional } from '../types/Devotional';
import '../styles/family.css';

/** Ler em família: um roteiro de tela cheia, uma coisa por vez, feito para ser lido em voz alta. */
export function FamilyRitual({ source, onClose }: { source: 'daily' | 'plan'; onClose: () => void }) {
  const { t, i18n } = useTranslation('common');
  const tt = (k: string, d: string, o?: Record<string, unknown>) => t(`ritual.${k}`, { defaultValue: d, ...o });

  const [family, setFamily] = useState<Family | null>(null);
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [kids, setKids] = useState<KidsVersion[]>([]);
  const [chosen, setChosen] = useState<'daily' | 'plan'>(source);
  const [present, setPresent] = useState<Set<string>>(new Set());
  const [step, setStep] = useState(0);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { FamilyService.get().then((f) => {
    setFamily(f);
    setPresent(new Set((f?.children ?? []).map((c) => c.id)));
  }).catch(() => setFailed(true)); }, []);

  const planDay = family?.plan && !family.plan.completed ? family.plan.days[family.plan.currentDay - 1] : null;
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

  const key = RITUAL_STEPS[step];
  const last = step === RITUAL_STEPS.length - 1;

  const finish = async () => {
    if (!devotional) return;
    setSaving(true);
    try { await JourneyService.complete(devotional.id, devotional.legacy_id); setSaved(true); } catch { setFailed(true); }
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
  if (!family || !devotional) return <div className="ritual"><div className="ritual__body"><p className="ritual__lead">…</p></div></div>;

  return (
    <div className="ritual" role="dialog" aria-modal="true" aria-label={tt('title', 'Ler em família')}>
      <header className="ritual__top">
        <div className="ritual__progress" aria-hidden="true">
          {RITUAL_STEPS.map((s, i) => <i key={s} className={i <= step ? 'is-on' : ''} />)}
        </div>
        <button type="button" className="fam-icon-btn" aria-label={tt('close', 'Fechar')} onClick={onClose}>×</button>
      </header>

      <div className="ritual__body">
        {key === 'welcome' && (
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

        {key === 'scripture' && (
          <>
            <p className="fam-eyebrow fam-eyebrow--accent">{tt('scripture', 'A passagem')}</p>
            {reader && <p className="fam-note">{tt('reader', '{{name}} lê em voz alta', { name: reader })}</p>}
            {devotional.scripture_reference && <h2 className="ritual__ref">{devotional.scripture_reference}</h2>}
            {devotional.scripture_text && <blockquote className="ritual__verse">{devotional.scripture_text}</blockquote>}
          </>
        )}

        {key === 'story' && (
          <>
            <p className="fam-eyebrow fam-eyebrow--accent">{tt('story', 'O que o texto diz')}</p>
            {perChild.length > 0 && perChild.some((p) => p.version) ? (
              perChild.map(({ child, version }) => (
                <section key={child.id} className="ritual__kid">
                  <h3>{child.nickname} · {child.band.replace('-', ' a ')} {tt('years', 'anos')}</h3>
                  {version ? <p>{version.whatItSays}</p> : <p className="fam-note">{tt('noKids', 'Ainda não há versão para esta faixa. Leia o texto dos adultos e converse.')}</p>}
                </section>
              ))
            ) : (
              <HtmlRenderer html={devotional.reflection} className="ritual__text" />
            )}
          </>
        )}

        {key === 'practice' && (
          <>
            <p className="fam-eyebrow fam-eyebrow--accent">{tt('practice', 'Para conversar e praticar')}</p>
            {perChild.some((p) => p.version) && perChild.filter((p) => p.version).map(({ child, version }) => (
              <section key={child.id} className="ritual__kid">
                <h3>{child.nickname}</h3>
                <p>{version!.thinkAbout}</p>
                <p><strong>{version!.practice}</strong></p>
                {version!.adultGuide && <p className="fam-note">{version!.adultGuide}</p>}
              </section>
            ))}
            {devotional.practical_application && <HtmlRenderer html={devotional.practical_application} className="ritual__text" />}
          </>
        )}

        {key === 'prayer' && (
          <>
            <p className="fam-eyebrow fam-eyebrow--accent">{tt('prayer', 'Oração')}</p>
            {devotional.prayer && <HtmlRenderer html={devotional.prayer} className="ritual__text ritual__prayer" />}
            {perChild.filter((p) => p.version?.prayer).map(({ child, version }) => (
              <section key={child.id} className="ritual__kid"><h3>{child.nickname}</h3><p>{version!.prayer}</p></section>
            ))}
          </>
        )}

        {key === 'done' && (
          <>
            <h1 className="ritual__title">{saved ? tt('doneTitle', 'Vocês leram juntos.') : tt('almost', 'Vamos registrar?')}</h1>
            <p className="ritual__lead">{saved ? tt('doneText', 'Cada adulto marca a própria leitura. Obrigado por separar esse tempo.') : tt('markText', 'Isso registra a sua leitura de hoje.')}</p>
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

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { illumineAuth } from '../lib/illumine';
import { BANDS, FamilyService, type Band, type KidsVersion } from '../services/FamilyService';
import { Paragraphs } from './Paragraphs';

/** "Ler com as crianças": só aparece quando o devocional tem versão infantil aprovada. */
export function KidsReading({ devotionalId, scriptureReference }: { devotionalId: string; scriptureReference?: string | null }) {
  const { t, i18n } = useTranslation('common');
  const [versions, setVersions] = useState<KidsVersion[]>([]);
  const [open, setOpen] = useState(false);
  const [band, setBand] = useState<Band | null>(null);

  useEffect(() => {
    if (!illumineAuth.isAuthenticated()) return;
    let alive = true;
    FamilyService.getKids(devotionalId, i18n.language).then((v) => { if (alive) setVersions(v); });
    return () => { alive = false; };
  }, [devotionalId, i18n.language]);

  if (!versions.length) return null;
  const available = BANDS.filter((b) => versions.some((v) => v.band === b));
  const current = versions.find((v) => v.band === (band ?? available[0]));

  if (!open) {
    return (
      <div className="kids">
        <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>{t('kids.open', 'Ler com as crianças')}</button>
      </div>
    );
  }

  return (
    <section className="kids kids--open" aria-label={t('kids.open', 'Ler com as crianças')}>
      <div className="kids__bands" role="tablist">
        {available.map((b) => (
          <button key={b} type="button" role="tab" aria-selected={b === current?.band}
            className={`kids__band${b === current?.band ? ' kids__band--on' : ''}`} onClick={() => setBand(b)}>
            {t('kids.ages', { range: b.replace('-', ' a '), defaultValue: '{{range}} anos' })}
          </button>
        ))}
      </div>
      {current && (
        <div className="kids__body">
          {current.title && <h3 className="kids__title">{current.title}</h3>}
          {/* Mesmo cartão de citação do devocional principal (PrincipleView). */}
          {(scriptureReference || current.scriptureFocus) && (
            <blockquote className="principle-scripture">
              {scriptureReference && <cite className="principle-scripture-reference">{scriptureReference}</cite>}
              {current.scriptureFocus && <p className="principle-scripture-text">&ldquo;{current.scriptureFocus}&rdquo;</p>}
            </blockquote>
          )}
          <h4>{t('kids.whatItSays', 'O que a Bíblia conta')}</h4>
          <Paragraphs text={current.whatItSays} />
          <h4>{t('kids.thinkAbout', 'Para pensar')}</h4>
          <Paragraphs text={current.thinkAbout} />
          <h4>{t('kids.practice', 'Para fazer hoje')}</h4>
          <Paragraphs text={current.practice} />
          <h4>{t('kids.prayer', 'Oração')}</h4>
          <Paragraphs text={current.prayer} />
          <aside className="kids__guide">
            <strong>{t('kids.guide', 'Guia e material de apoio')}</strong>
            <Paragraphs text={current.adultGuide} />
          </aside>
        </div>
      )}
      <button type="button" className="kids__close" onClick={() => setOpen(false)}>{t('kids.close', 'Fechar')}</button>
    </section>
  );
}

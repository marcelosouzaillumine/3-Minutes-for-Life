import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { JourneyService } from '../services/JourneyService';
import { summarizeJourney, type JourneySummary } from '../utils/journey';
import { getTodayInSaoPaulo } from '../utils/date';

/**
 * Carrega a jornada do usuário logado. Falha em silêncio: sequência é um
 * extra, nunca deve atrapalhar a leitura.
 */
export function useJourney(enabled: boolean): JourneySummary | null {
  const [summary, setSummary] = useState<JourneySummary | null>(null);

  useEffect(() => {
    if (!enabled) {
      setSummary(null);
      return;
    }
    let mounted = true;
    JourneyService.getProgress()
      .then((rows) => {
        if (mounted) setSummary(summarizeJourney(rows, getTodayInSaoPaulo()));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [enabled]);

  return summary;
}

/** Linha discreta na Home: só aparece com pelo menos 2 dias seguidos. */
export function StreakLine({ summary }: { summary: JourneySummary | null }) {
  const { t } = useTranslation('common');
  if (!summary || summary.currentStreak < 2) return null;
  return (
    <p className="journey-streak-line" aria-live="polite">
      {t('journey.streak', { count: summary.currentStreak })}
    </p>
  );
}

/** Resumo do mês no Perfil. */
export function JourneySummaryCard() {
  const { t } = useTranslation('common');
  const summary = useJourney(true);
  if (!summary || summary.totalDays === 0) return null;

  const stats = [
    { value: summary.currentStreak, label: t('journey.currentStreak') },
    { value: summary.longestStreak, label: t('journey.longestStreak') },
    { value: summary.daysThisMonth, label: t('journey.daysThisMonth') },
    { value: summary.completedThisMonth, label: t('journey.completedThisMonth') },
  ];

  return (
    <div className="journey-card">
      <h4 className="journey-card-title">{t('journey.title')}</h4>
      <div className="journey-card-grid">
        {stats.map((s) => (
          <div key={s.label} className="journey-card-stat">
            <span className="journey-card-value">{s.value}</span>
            <span className="journey-card-label">{s.label}</span>
          </div>
        ))}
      </div>
      <p className="journey-card-note">{t('journey.note')}</p>
    </div>
  );
}

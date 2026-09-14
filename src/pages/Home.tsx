import { DevotionalService } from '../services/DevotionalService';
import { getTodayInSaoPaulo } from '../utils/date';
import { useState, useEffect } from 'react';
import type { Devotional } from '../types/Devotional';
import { useTranslation } from 'react-i18next';
import { AnalyticsService } from '../services/AnalyticsService';
import { PrincipleView } from '../components/PrincipleView';
import { DevotionalHeader } from '../components/DevotionalHeader';

interface HomeProps {
  onExplore: () => void;
}

export function Home({ onExplore }: HomeProps) {
  const { t, i18n } = useTranslation(['common']);

  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [notAvailable, setNotAvailable] = useState(false);

  /*
   * ============================================================
   * LOAD DAILY DEVOTIONAL
   * ============================================================
   */

  useEffect(() => {
    let mounted = true;

    const fetchDaily = async () => {
      try {
        setLoading(true);
        setError(null);

        const todayStr = getTodayInSaoPaulo();

        const data = await DevotionalService.getDailyDevotional(
          todayStr,
          i18n.language
        );

        if (!mounted) return;

        setDevotional(data);

        /*
         * Track devotional view
         * BUGFIX (auditoria Intelligence Center): o nome correto na taxonomia
         * é 'devotional_opened' — 'devotional_view' não está na lista de
         * eventos permitidos pela edge function e era rejeitado
         * silenciosamente, fazendo a métrica "Leituras" nunca contar
         * as leituras feitas pela Home.
         */
        AnalyticsService.trackEvent(
          'devotional_opened',
          {
            devotional_id: data.id,
            title: data.title,
            language: i18n.language,
          }
        );
      } catch (err: any) {
        console.error('Failed to load daily devotional:', err);

        if (mounted) {
          if (err?.code === 'DEVOTIONAL_NOT_AVAILABLE') {
            setNotAvailable(true);
          } else {
            setError(
              err instanceof Error
                ? err
                : new Error('Failed to load devotional')
            );
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchDaily();

    return () => {
      mounted = false;
    };
  }, [i18n.language]);

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div className="page-home home-state">
        <DevotionalHeader showLogo={true} />
        <div className="home-loading">
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * ERROR
   * ============================================================
   */

  if (notAvailable) {
    return (
      <div className="page-home home-state">
        <DevotionalHeader showLogo={true} />
        <div className="home-unavailable">
          <p className="home-unavailable__title">📖</p>
          <p className="home-unavailable__message">
            O devocional de hoje ainda não está disponível, mas você pode explorar os devocionais disponíveis na nossa biblioteca.
          </p>
          <button
            className="btn-primary"
            onClick={onExplore}
          >
            Ver biblioteca
          </button>
        </div>
      </div>
    );
  }

  if (error || !devotional) {
    return (
      <div className="page-home home-state">
        <DevotionalHeader showLogo={true} />
        <div className="home-error">
          <p>{t('error')}</p>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            {t('continue')}
          </button>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * HOME
   * ============================================================
   */

  return (
    <PrincipleView
      devotional={devotional}
      onExplore={onExplore}
    />
  );
}
import { useEffect, useState } from 'react';
import { DevotionalService } from '../services/DevotionalService';
import { AnalyticsService } from '../services/AnalyticsService';
import type { Devotional } from '../types/Devotional';
import { PrincipleView } from '../components/PrincipleView';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';

export function SharedDevotional() {
  const { t, i18n } = useTranslation(['common']);
  const { user } = useAuth();

  const [devotional, setDevotional] =
    useState<Devotional | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<Error | null>(null);

  const [senderName, setSenderName] =
    useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const searchParams = new URLSearchParams(
      window.location.search
    );

    const devotionalId = searchParams.get('d');
    const urlLang = searchParams.get('lang');

    const pathname = window.location.pathname;

    const code = pathname
      .replace('/r/', '')
      .split('?')[0]
      .replace('/', '');

    const loadSharedDevotional = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!devotionalId) {
          throw new Error('No devotional ID found');
        }

        /*
         * ========================================================
         * LANGUAGE
         * ========================================================
         *
         * O idioma definido no link possui prioridade.
         *
         * Exemplo:
         * /r/ABC123?d=xxx&lang=en
         *
         * Isso garante que o conteúdo compartilhado seja aberto
         * no idioma em que foi originalmente compartilhado.
         */

        const targetLang =
          urlLang || i18n.language;

        if (
          urlLang &&
          i18n.language !== urlLang
        ) {
          await i18n.changeLanguage(urlLang);
        }

        /*
         * ========================================================
         * DEVOTIONAL
         * ========================================================
         */

        const data =
          await DevotionalService.getDevotional(
            devotionalId,
            targetLang
          );

        if (!mounted) {
          return;
        }

        setDevotional(data);

        /*
         * ========================================================
         * ANALYTICS
         * ========================================================
         */

        AnalyticsService.trackEvent(
          'devotional_opened',
          {
            devotional_id: devotionalId,
            channel: 'shared_link',
            language: targetLang,
          }
        );

        /*
         * ========================================================
         * REFERRER
         * ========================================================
         *
         * Recupera o nome da pessoa que compartilhou
         * o devocional.
         */

        if (code) {
          const {
            data: referrerName,
            error: referrerError,
          } = await supabase.rpc(
            'get_referrer_name',
            {
              p_referral_code: code,
            }
          );

          if (!mounted) {
            return;
          }

          if (
            !referrerError &&
            referrerName
          ) {
            const firstName =
              referrerName
                .trim()
                .split(/\s+/)[0];

            if (firstName) {
              setSenderName(firstName);
            }
          }
        }
      } catch (err) {
        console.error(
          'Failed to load shared devotional:',
          err
        );

        if (mounted) {
          setError(
            err instanceof Error
              ? err
              : new Error(
                'Failed to load devotional'
              )
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSharedDevotional();

    return () => {
      mounted = false;
    };
  }, [i18n.language]);

  /*
   * ============================================================
   * CTA
   * ============================================================
   */

  const handleCtaClick = () => {
    window.location.href = '/login';
  };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div className="shared-devotional-page">
        <header className="principle-view-header">
          <BrandLogo
            variant="light"
            alt="3 Minutes for Life"
            className="landing-logo-img"
          />
        </header>

        <main className="page-home">
          <div
            style={{
              minHeight: '50vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <span
              className="label"
              style={{
                opacity: 0.5,
              }}
            >
              {t(
                'common:loading',
                'Carregando reflexão...'
              )}
            </span>
          </div>
        </main>
      </div>
    );
  }

  /*
   * ============================================================
   * ERROR
   * ============================================================
   */

  if (error || !devotional) {
    window.location.href = '/';
    return null;
  }

  /*
   * ============================================================
   * SHARED DEVOTIONAL
   * ============================================================
   */

  return (
    <div className="shared-devotional-page">

      {/* ========================================================
          HEADER
      ========================================================= */}

      <header className="principle-view-header">
        <BrandLogo
          variant="light"
          alt="3 Minutes for Life"
          className="landing-logo-img"
          style={{
            marginTop: '1rem',
            width: '90px',
            height: 'auto',
            display: 'block',
          }}
        />
      </header>

      {/* ========================================================
          CONTENT
      ========================================================= */}

      <main className="page-home">

        {/* ======================================================
            SENDER MESSAGE
        ======================================================= */}

        <div
          className="perceived-statement"
          style={{
            fontSize: '1.5rem',
            lineHeight: 1.4,
            marginTop: '2rem',
            marginBottom: '2rem',
          }}
        >
          {senderName
            ? t(
              'shared.senderShared',
              {
                name: senderName,
                defaultValue:
                  `${senderName} compartilhou esta reflexão com você.`,
              }
            )
            : t(
              'shared.someoneShared',
              'Alguém compartilhou esta reflexão com você.'
            )}
        </div>

        {/* ======================================================
            DEVOTIONAL
        ======================================================= */}

        <PrincipleView
          devotional={devotional}
          customAction={
            !user
              ? {
                variant: 'shared',

                text: t(
                  'shared.ctaText',
                  'Que estes três minutos não terminem aqui.'
                ),

                subtext: t(
                  'shared.ctaSubtext',
                  'Amanhã, uma nova reflexão espera por você.'
                ),

                label: t(
                  'shared.ctaButton',
                  'Quero continuar'
                ),

                note: t(
                  'shared.ctaNote',
                  'Gratuito, sempre.'
                ),

                onClick: handleCtaClick,
              }
              : undefined
          }
        />

      </main>
    </div>
  );
}
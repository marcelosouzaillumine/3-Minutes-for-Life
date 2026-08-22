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

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<Error | null>(null);

  const [senderName, setSenderName] =
    useState<string | null>(null);

  /*
   * ============================================================
   * LOAD SHARED DEVOTIONAL
   * ============================================================
   */

  useEffect(() => {
    let mounted = true;

    const searchParams =
      new URLSearchParams(
        window.location.search
      );

    const devotionalId =
      searchParams.get('d');

    const urlLang =
      searchParams.get('lang');

    const pathname =
      window.location.pathname;

    const code = pathname
      .replace('/r/', '')
      .split('?')[0]
      .replace('/', '')
      .trim();

    const loadSharedDevotional =
      async () => {
        try {
          /*
           * ------------------------------------------------------
           * VALIDATE DEVOTIONAL ID
           * ------------------------------------------------------
           */

          if (!devotionalId) {
            throw new Error(
              'No devotional ID found'
            );
          }

          /*
           * ------------------------------------------------------
           * LANGUAGE
           * ------------------------------------------------------
           */

          const targetLang =
            urlLang || i18n.language;

          if (
            urlLang &&
            i18n.language !== urlLang
          ) {
            await i18n.changeLanguage(
              urlLang
            );
          }

          /*
           * ------------------------------------------------------
           * LOAD DEVOTIONAL
           * ------------------------------------------------------
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
           * ------------------------------------------------------
           * ANALYTICS
           * ------------------------------------------------------
           */

          AnalyticsService.trackEvent(
            'devotional_opened',
            {
              devotional_id:
                devotionalId,

              channel:
                'shared_link',

              language:
                targetLang,
            }
          );

          /*
           * ------------------------------------------------------
           * LOAD REFERRER
           * ------------------------------------------------------
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
                String(referrerName)
                  .trim()
                  .split(/\s+/)[0];

              if (firstName) {
                setSenderName(
                  firstName
                );
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
  }, [i18n]);

  /*
   * ============================================================
   * CTA
   * ============================================================
   */

  const handleCtaClick = () => {
    window.location.href =
      '/login';
  };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div className="shared-devotional-page">

        <div className="shared-devotional-container">

          <header className="shared-devotional-header">

            <BrandLogo
              variant="light"
              alt="3 Minutes for Life"
              className="shared-devotional-logo"
            />

          </header>

          <main className="shared-devotional-loading">

            <span className="label">
              {t(
                'common:loading',
                'Carregando reflexão...'
              )}
            </span>

          </main>

        </div>

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

      <div className="shared-devotional-container">

        {/* ======================================================
            HEADER / LOGO
        ======================================================= */}

        <header className="shared-devotional-header">

          <BrandLogo
            variant="light"
            alt="3 Minutes for Life"
            className="shared-devotional-logo"
          />

        </header>

        {/* ======================================================
            CONTENT
        ======================================================= */}

        <main className="shared-devotional-content">

          {/* ====================================================
              SENDER MESSAGE
          ===================================================== */}

          <div className="shared-devotional-sender">

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

          {/* ====================================================
              DEVOTIONAL
          ===================================================== */}

          <div className="shared-devotional-principle">

            <PrincipleView
              devotional={devotional}
              showLogo={false}
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

                    onClick:
                      handleCtaClick,
                  }
                  : undefined
              }
            />

          </div>

        </main>

      </div>

    </div>
  );
}
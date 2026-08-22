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
  const [error, setError] = useState<Error | null>(null);
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
      .replace('/', '')
      .trim();

    const loadSharedDevotional = async () => {
      try {
        if (!devotionalId) {
          throw new Error('No devotional ID found');
        }

        /*
         * =========================================================
         * LANGUAGE
         * =========================================================
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
         * =========================================================
         * DEVOTIONAL
         * =========================================================
         */

        const data =
          await DevotionalService.getDevotional(
            devotionalId,
            targetLang
          );

        if (!mounted) return;

        setDevotional(data);

        /*
         * =========================================================
         * ANALYTICS
         * =========================================================
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
         * =========================================================
         * REFERRER
         * =========================================================
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

          if (!mounted) return;

          if (
            !referrerError &&
            referrerName
          ) {
            const firstName = String(
              referrerName
            )
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
  }, [i18n]);

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
      <div
        className="shared-devotional-page"
        style={{
          width: '100%',
          maxWidth: '100%',
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="shared-devotional-container"
          style={{
            width: '100%',
            maxWidth: '600px',
            margin: '0 auto',
            padding: '0 1rem 4rem',
            boxSizing: 'border-box',
          }}
        >
          <header
            className="shared-devotional-header"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              padding: 0,
              margin: 0,
              boxSizing: 'border-box',
            }}
          >
            <BrandLogo
              variant="light"
              alt="3 Minutes for Life"
              className="landing-logo-img"
              style={{
                width: '120px',
                height: 'auto',
                display: 'block',
                flexShrink: 0,
                marginTop: '1.25rem',
                marginBottom: '2.5rem',
              }}
            />
          </header>

          <main
            style={{
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
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
    <div
      className="shared-devotional-page"
      style={{
        width: '100%',
        maxWidth: '100%',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="shared-devotional-container"
        style={{
          width: '100%',
          maxWidth: '600px',
          margin: '0 auto',
          padding: '0 1rem 5rem',
          boxSizing: 'border-box',
        }}
      >

        {/* ======================================================
            HEADER / LOGO
        ======================================================= */}

        <header
          className="shared-devotional-header"
          style={{
            width: '100%',
            maxWidth: '100%',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            padding: 0,
            margin: 0,
            boxSizing: 'border-box',
          }}
        >
          <BrandLogo
            variant="light"
            alt="3 Minutes for Life"
            className="landing-logo-img"
            style={{
              width: '120px',
              height: 'auto',
              display: 'block',
              flexShrink: 0,
              marginTop: '1.25rem',
              marginBottom: '2.5rem',
            }}
          />
        </header>

        {/* ======================================================
            CONTENT
        ======================================================= */}

        <main
          className="shared-devotional-content"
          style={{
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
            overflowWrap: 'break-word',
            wordBreak: 'normal',
          }}
        >

          {/* ====================================================
              SENDER MESSAGE
          ===================================================== */}

          <div
            className="perceived-statement"
            style={{
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              fontSize: '1.5rem',
              lineHeight: 1.4,
              marginTop: 0,
              marginBottom: '2.5rem',
              overflowWrap: 'break-word',
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

          {/* ====================================================
              DEVOTIONAL
          ===================================================== */}

          <div
            style={{
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
            }}
          >
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
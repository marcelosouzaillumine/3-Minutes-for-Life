import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { DevotionalService } from '../services/DevotionalService';
import { AnalyticsService } from '../services/AnalyticsService';
import type { Devotional } from '../types/Devotional';
import { PrincipleView } from '../components/PrincipleView';
import { illumineFetch } from '../lib/illumine';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { DevotionalHeader } from '../components/DevotionalHeader';

export function SharedDevotional() {
  const { t, i18n } = useTranslation(['common']);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ code: string }>();

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
        location.search
      );

    const devotionalId =
      searchParams.get('d');

    const urlLang =
      searchParams.get('lang');

    const code = (params.code ?? '').trim();

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
            let referrerName: string | null = null;
            try {
              const res = await illumineFetch(`/referrals/${encodeURIComponent(code)}`);
              if (res.ok) {
                const body = await res.json();
                referrerName = body.name ?? body.referrerName ?? null;
              }
            } catch { /* silently ignore */ }

            if (!mounted) {
              return;
            }

            if (referrerName) {
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
    navigate('/login');
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

          <DevotionalHeader showLogo={true} />

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
    navigate('/', { replace: true });
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
            CONTENT
        ======================================================= */}

        <main className="shared-devotional-content">

          {/* ====================================================
              SENDER MESSAGE
          ===================================================== */}

          <div className="shared-devotional-sender">

            {/* Avatar com a inicial: transforma um aviso de sistema em
                gesto de alguém. Decorativo — o nome já está no texto,
                então fica oculto para leitores de tela. */}
            <span className="sender-avatar" aria-hidden="true">
              {senderName ? senderName.trim().charAt(0).toUpperCase() : '\u2665'}
            </span>

            <span className="sender-text">
              {senderName ? (
                <>
                  {/* Nome separado do resto para receber ênfase. Nos
                      três idiomas o nome vem primeiro, então a quebra
                      é segura. */}
                  <strong>{senderName}</strong>{' '}
                  {t('shared.sharedSuffix', 'compartilhou esta reflexão com você.')}
                </>
              ) : (
                t('shared.someoneShared', 'Alguém compartilhou esta reflexão com você.')
              )}
            </span>

          </div>

          {/* ====================================================
              DEVOTIONAL
          ===================================================== */}

          <div className="shared-devotional-principle">

            <PrincipleView
              devotional={devotional}
              showLogo={true}
              customAction={
                !user
                  ? {
                    variant: 'shared',

                    text: t(
                      'shared.ctaText',
                      'Três minutos que mudam um dia.'
                    ),

                    subtext: t(
                      'shared.ctaSubtext',
                      'Amanhã tem mais. Faça parte da jornada — é gratuito e você pode começar agora.'
                    ),

                    label: t(
                      'shared.ctaButton',
                      'Quero a minha conta'
                    ),

                    note: t(
                      'shared.ctaNote',
                      'Sem cartão de crédito.'
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
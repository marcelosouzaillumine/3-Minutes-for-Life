import { DevotionalService } from '../services/DevotionalService';
import { JourneyService } from '../services/JourneyService';
import { getTodayInSaoPaulo } from '../utils/date';
import { useState, useEffect } from 'react';
import type { Devotional } from '../types/Devotional';
import { ShareButton } from '../components/ShareButton';
import { RelationshipSection } from '../components/RelationshipSection';
import { useTranslation } from 'react-i18next';
import { HtmlRenderer } from '../components/HtmlRenderer';
import { useAuth } from '../context/AuthContext';
import { ReflectionService } from '../services/ReflectionService';
import { AnalyticsService } from '../services/AnalyticsService';
import { CtaEngine } from '../services/CtaEngine';
import { BrandLogo } from '../components/BrandLogo';

interface HomeProps {
  onExplore: () => void;
}

export function Home({ onExplore }: HomeProps) {
  const { t, i18n } = useTranslation(['common']);
  const { user } = useAuth();

  const [devotional, setDevotional] =
    useState<Devotional | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saved, setSaved] = useState(false);

  const [reflectionContent, setReflectionContent] =
    useState('');

  const [savingReflection, setSavingReflection] =
    useState(false);

  const [savedReflectionSuccess, setSavedReflectionSuccess] =
    useState(false);

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

        const data =
          await DevotionalService.getDailyDevotional(
            todayStr,
            i18n.language
          );

        if (!mounted) return;

        setDevotional(data);

        /*
         * Check saved status
         */
        const favorites =
          await JourneyService.listFavorites();

        if (!mounted) return;

        setSaved(favorites.includes(data.id));

        /*
         * Track devotional view
         */
        AnalyticsService.trackEvent(
          'devotional_view',
          {
            devotional_id: data.id,
            title: data.title,
            language: i18n.language,
          }
        );
      } catch (err) {
        console.error(
          'Failed to load daily devotional:',
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

    fetchDaily();

    return () => {
      mounted = false;
    };
  }, [i18n.language]);

  /*
   * ============================================================
   * TOGGLE FAVORITE
   * ============================================================
   */

  const toggleSave = async () => {
    if (!devotional) return;

    try {
      const isSaved =
        await JourneyService.toggleFavorite(
          devotional.id
        );

      setSaved(isSaved);
    } catch (err) {
      console.error(err);

      alert(
        t(
          'home.saveError',
          'Erro ao atualizar favorito.'
        )
      );
    }
  };

  /*
   * ============================================================
   * MARK COMPLETE
   * ============================================================
   */

  const markComplete = async () => {
    if (!devotional) return;

    try {
      await JourneyService.complete(
        devotional.id
      );

      alert(t('completed'));
    } catch (err) {
      console.error(err);
    }
  };

  /*
   * ============================================================
   * SAVE PERSONAL REFLECTION
   * ============================================================
   */

  const handleSaveReflection = async () => {
    if (
      !devotional ||
      !reflectionContent.trim()
    ) {
      return;
    }

    try {
      setSavingReflection(true);

      await ReflectionService.saveReflection(
        devotional.id,
        reflectionContent.trim()
      );

      setSavedReflectionSuccess(true);
      setReflectionContent('');

      setTimeout(() => {
        setSavedReflectionSuccess(false);
      }, 3000);
    } catch (err) {
      console.error(
        'Failed to save reflection:',
        err
      );

      alert(
        t(
          'home.saveError',
          'Erro ao salvar reflexão.'
        )
      );
    } finally {
      setSavingReflection(false);
    }
  };

  /*
   * ============================================================
   * LOGO
   * ============================================================
   *
   * IMPORTANTE:
   *
   * Esta página possui fundo CLARO.
   *
   * Portanto:
   *
   *   light = logo para fundo claro
   *   dark  = logo para fundo escuro
   *
   * Nunca usar "auto" aqui, porque a interface da aplicação
   * não deve trocar a identidade visual apenas porque o celular
   * está configurado em modo escuro.
   * ============================================================
   */

  const renderLogo = () => (
    <header
      className="principle-view-header"
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        padding: 0,
        margin: 0,
        background: 'transparent',
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
          marginTop: '1rem',
          marginBottom: '2.5rem',
          flexShrink: 0,
          maxWidth: '120px',
        }}
      />
    </header>
  );

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div
        className="page-home"
        style={{
          minHeight: '50vh',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden',
        }}
      >
        {renderLogo()}

        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <p
            style={{
              color:
                'var(--color-text-light)',
            }}
          >
            {t('loading')}
          </p>
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
    return (
      <div
        className="page-home"
        style={{
          minHeight: '50vh',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden',
        }}
      >
        {renderLogo()}

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            width: '100%',
          }}
        >
          <p
            style={{
              color:
                'var(--color-text-light)',
              marginBottom: '1rem',
            }}
          >
            {t('error')}
          </p>

          <button
            className="btn-primary"
            onClick={() =>
              window.location.reload()
            }
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
    <div
      className="page-home"
      style={{
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
      }}
    >

      {/* ========================================================
          HEADER / LOGO
      ========================================================= */}

      {renderLogo()}

      {/* ========================================================
          DAILY PRINCIPLE
      ========================================================= */}

      <span className="label">
        {t('home.todayPrinciple')}
      </span>

      <h1 className="principle-title">
        {devotional.title}
      </h1>

      {/* ========================================================
          AUDIO
      ========================================================= */}

      {devotional.audio_url && (
        <div
          style={{
            width: '100%',
            maxWidth: '100%',
            marginBottom: '2rem',
          }}
        >
          <audio
            controls
            src={devotional.audio_url}
            style={{
              width: '100%',
              maxWidth: '100%',
              height: '40px',
            }}
          />
        </div>
      )}

      {/* ========================================================
          PRINCIPLE STATEMENT
      ========================================================= */}

      {devotional.principle_statement && (
        <p className="principle-statement">
          {devotional.principle_statement}
        </p>
      )}

      {/* ========================================================
          REFLECTION
      ========================================================= */}

      <HtmlRenderer
        html={CtaEngine.composeReflection(
          devotional.reflection,
          {
            user,
            language: i18n.language,
          }
        )}
        className="principle-reflection"
      />

      {/* ========================================================
          APPLICATION SECTION
      ========================================================= */}

      <div className="application-section">

        <span className="label">
          {t('home.practiceToday')}
        </span>

        <div className="application-text">
          {devotional.practical_application ? (
            <HtmlRenderer
              html={
                devotional.practical_application
              }
            />
          ) : (
            <p
              style={{
                marginBottom: '1rem',
                fontStyle: 'italic',
                opacity: 0.7,
              }}
            >
              {t(
                'home.applicationPending'
              )}
            </p>
          )}
        </div>

        {/* ======================================================
            SCRIPTURE
        ======================================================= */}

        {devotional.scripture_reference && (
          <div
            style={{
              marginTop: '2rem',
              borderTop:
                '1px solid var(--color-border)',
              paddingTop: '1.5rem',
              width: '100%',
              maxWidth: '100%',
            }}
          >
            <span className="label">
              {t(
                'home.scriptureReference'
              )}
            </span>

            <p
              style={{
                fontWeight: 500,
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
              }}
            >
              {
                devotional.scripture_reference
              }
            </p>

            {devotional.scripture_text && (
              <p
                style={{
                  marginTop: '0.5rem',
                  lineHeight: '1.6',
                  color:
                    'var(--color-text-light)',
                  fontSize: '0.95rem',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                }}
              >
                &ldquo;
                {devotional.scripture_text}
                &rdquo;
              </p>
            )}
          </div>
        )}

        {/* ======================================================
            PRAYER
        ======================================================= */}

        {devotional.prayer && (
          <div
            style={{
              marginTop: '2rem',
              borderTop:
                '1px solid var(--color-border)',
              paddingTop: '1.5rem',
              width: '100%',
              maxWidth: '100%',
            }}
          >
            <span className="label">
              {t('home.prayer')}
            </span>

            <div
              className="application-text"
              style={{
                fontStyle: 'italic',
              }}
            >
              <HtmlRenderer
                html={devotional.prayer}
              />
            </div>
          </div>
        )}

        {/* ======================================================
            MY REFLECTION
        ======================================================= */}

        <div
          style={{
            marginTop: '2.5rem',
            marginBottom: '2.5rem',
            borderTop:
              '1px solid var(--color-border)',
            paddingTop: '2rem',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
          }}
        >
          <h3
            style={{
              fontSize: '1.2rem',
              marginBottom: '0.5rem',
              fontWeight: 600,
            }}
          >
            {t('home.myReflection')}
          </h3>

          <p
            style={{
              fontSize: '0.95rem',
              color:
                'var(--color-text-light)',
              marginBottom: '1.5rem',
              lineHeight: 1.5,
            }}
          >
            {t(
              'home.myReflectionPrompt'
            )}
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              width: '100%',
              minWidth: 0,
            }}
          >
            <textarea
              value={reflectionContent}
              onChange={(e) =>
                setReflectionContent(
                  e.target.value
                )
              }
              placeholder={t(
                'home.myReflectionPlaceholder'
              )}
              style={{
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                minHeight: '120px',
                padding: '1rem',
                borderRadius: '12px',
                border:
                  '1px solid var(--color-border)',
                background:
                  'var(--color-bg)',
                color:
                  'var(--color-text)',
                fontSize: '1rem',
                lineHeight: '1.5',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />

            <p
              style={{
                fontSize: '0.8rem',
                color:
                  'var(--color-text-light)',
                marginTop: '-0.5rem',
                fontStyle: 'italic',
              }}
            >
              {t(
                'home.myReflectionPrivate'
              )}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '0.5rem',
                flexWrap: 'wrap',
                minWidth: 0,
              }}
            >
              <button
                onClick={
                  handleSaveReflection
                }
                disabled={
                  savingReflection ||
                  !reflectionContent.trim()
                }
                style={{
                  padding:
                    '0.75rem 1.5rem',
                  borderRadius: '24px',
                  border: 'none',
                  background:
                    'var(--color-text)',
                  color:
                    'var(--color-bg)',
                  fontWeight: 600,
                  cursor:
                    savingReflection ||
                      !reflectionContent.trim()
                      ? 'not-allowed'
                      : 'pointer',
                  opacity:
                    savingReflection ||
                      !reflectionContent.trim()
                      ? 0.5
                      : 1,
                  transition:
                    'opacity 0.2s',
                }}
              >
                {savingReflection
                  ? t(
                    'home.savingReflection'
                  )
                  : t(
                    'home.saveReflection'
                  )}
              </button>

              {savedReflectionSuccess && (
                <span
                  style={{
                    fontSize: '0.9rem',
                    color: '#4CAF50',
                    fontWeight: 500,
                  }}
                >
                  {t(
                    'home.reflectionSaved'
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================
            ACTION BAR
        ======================================================= */}

        <div className="action-bar">

          {/* SAVE */}

          <button
            className={`action-btn ${saved ? 'active' : ''
              }`}
            onClick={toggleSave}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>

            <span className="action-label">
              {saved
                ? t('saved')
                : t('save')}
            </span>
          </button>

          {/* COMPLETE */}

          <button
            className="action-btn"
            onClick={markComplete}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>

            <span className="action-label">
              {t('complete')}
            </span>
          </button>

          {/* SHARE */}

          <ShareButton
            devotional={devotional}
            asIcon={true}
          />
        </div>

        {/* ======================================================
            RELATIONSHIP
        ======================================================= */}

        <RelationshipSection
          devotionalId={devotional.id}
        />

        {/* ======================================================
            EXPLORE MORE
        ======================================================= */}

        <div
          style={{
            marginTop: '1rem',
            width: '100%',
            maxWidth: '100%',
          }}
        >
          <button
            className="btn-secondary"
            onClick={onExplore}
          >
            {t('home.exploreMore')}
          </button>
        </div>

      </div>
    </div>
  );
}
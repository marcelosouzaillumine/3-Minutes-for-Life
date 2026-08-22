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

        const todayStr =
          getTodayInSaoPaulo();

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

        setSaved(
          favorites.includes(data.id)
        );

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
   * A Home possui fundo claro.
   *
   * A logo possui classe própria:
   *
   *   home-logo
   *
   * Não usamos:
   *
   *   landing-logo-img
   *
   * porque essa classe pertence ao sistema visual da Landing
   * e possui regras próprias de tamanho.
   * ============================================================
   */

  const renderLogo = () => (
    <header className="home-header">
      <BrandLogo
        variant="light"
        alt="3 Minutes for Life"
        className="home-logo"
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
      <div className="page-home home-state">
        {renderLogo()}

        <div className="home-loading">
          <p>
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
      <div className="page-home home-state">
        {renderLogo()}

        <div className="home-error">
          <p>
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
    <div className="page-home">

      {/* ======================================================
          HEADER / LOGO
      ======================================================= */}

      {renderLogo()}

      {/* ======================================================
          DAILY PRINCIPLE
      ======================================================= */}

      <span className="label">
        {t('home.todayPrinciple')}
      </span>

      <h1 className="principle-title">
        {devotional.title}
      </h1>

      {/* ======================================================
          AUDIO
      ======================================================= */}

      {devotional.audio_url && (
        <div className="home-audio">
          <audio
            controls
            src={devotional.audio_url}
          />
        </div>
      )}

      {/* ======================================================
          PRINCIPLE STATEMENT
      ======================================================= */}

      {devotional.principle_statement && (
        <p className="principle-statement">
          {devotional.principle_statement}
        </p>
      )}

      {/* ======================================================
          REFLECTION
      ======================================================= */}

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

      {/* ======================================================
          APPLICATION SECTION
      ======================================================= */}

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

        {/* ====================================================
            SCRIPTURE
        ===================================================== */}

        {devotional.scripture_reference && (
          <div className="home-content-section">

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

        {/* ====================================================
            PRAYER
        ===================================================== */}

        {devotional.prayer && (
          <div className="home-content-section">

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

        {/* ====================================================
            MY REFLECTION
        ===================================================== */}

        <div className="home-reflection">

          <h3>
            {t('home.myReflection')}
          </h3>

          <p className="home-reflection-description">
            {t(
              'home.myReflectionPrompt'
            )}
          </p>

          <div className="home-reflection-form">

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
            />

            <p className="home-reflection-private">
              {t(
                'home.myReflectionPrivate'
              )}
            </p>

            <div className="home-reflection-actions">

              <button
                onClick={
                  handleSaveReflection
                }
                disabled={
                  savingReflection ||
                  !reflectionContent.trim()
                }
                className="home-save-reflection"
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
                <span className="home-reflection-success">
                  {t(
                    'home.reflectionSaved'
                  )}
                </span>
              )}

            </div>

          </div>

        </div>

        {/* ====================================================
            ACTION BAR
        ===================================================== */}

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

        {/* ====================================================
            RELATIONSHIP
        ===================================================== */}

        <RelationshipSection
          devotionalId={devotional.id}
        />

        {/* ====================================================
            EXPLORE MORE
        ===================================================== */}

        <div className="home-explore">
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
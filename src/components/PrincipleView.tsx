import type { Devotional } from '../types/Devotional';
import { JourneyService } from '../services/JourneyService';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ShareButton } from './ShareButton';
import { HtmlRenderer } from './HtmlRenderer';
import { useAuth } from '../context/AuthContext';
import { ReflectionService } from '../services/ReflectionService';
import { RelationshipSection } from './RelationshipSection';
import { CtaEngine } from '../services/CtaEngine';
import { BrandLogo } from './BrandLogo';

interface PrincipleViewProps {
  devotional: Devotional;
  onBack?: () => void;
  customAction?: {
    label: string;
    onClick: () => void;
    variant?: 'shared';
    text?: string;
    subtext?: string;
    note?: string;
  };
}

export function PrincipleView({
  devotional,
  onBack,
  customAction,
}: PrincipleViewProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [saved, setSaved] = useState(false);

  const [reflectionContent, setReflectionContent] =
    useState('');

  const [savingReflection, setSavingReflection] =
    useState(false);

  const [savedReflectionSuccess, setSavedReflectionSuccess] =
    useState(false);

  /*
   * ============================================================
   * INITIALIZE DEVOTIONAL
   * ============================================================
   */

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        /*
         * Start journey using canonical devotional UUID.
         */
        await JourneyService.start(devotional.id);
      } catch (error) {
        console.error(
          'Failed to start devotional journey:',
          error
        );
      }

      /*
       * Load favorite status.
       */
      try {
        const ids = await JourneyService.listFavorites();

        if (mounted) {
          setSaved(ids.includes(devotional.id));
        }
      } catch (error) {
        console.error(
          'Failed to load favorite status:',
          error
        );
      }

      /*
       * Load existing personal reflection.
       */
      if (user) {
        try {
          const content =
            await ReflectionService.getReflection(
              devotional.id
            );

          if (mounted) {
            setReflectionContent(content || '');
          }
        } catch (error) {
          console.error(
            'Failed to load existing reflection:',
            error
          );
        }
      } else if (mounted) {
        setReflectionContent('');
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [devotional.id, user]);

  /*
   * ============================================================
   * FAVORITE
   * ============================================================
   */

  const toggleSave = async () => {
    try {
      const isSaved =
        await JourneyService.toggleFavorite(
          devotional.id
        );

      setSaved(isSaved);
    } catch (error) {
      console.error(
        'Failed to update favorite:',
        error
      );

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
   * COMPLETE
   * ============================================================
   */

  const markComplete = async () => {
    try {
      await JourneyService.complete(
        devotional.id
      );

      alert(t('completed'));
    } catch (error) {
      console.error(
        'Failed to complete devotional:',
        error
      );
    }
  };

  /*
   * ============================================================
   * SAVE PERSONAL REFLECTION
   * ============================================================
   */

  const handleSaveReflection = async () => {
    if (!user) {
      handleLoginForReflection();
      return;
    }

    const content = reflectionContent.trim();

    if (!content) return;

    try {
      setSavingReflection(true);

      await ReflectionService.saveReflection(
        devotional.id,
        content
      );

      setSavedReflectionSuccess(true);

      window.setTimeout(() => {
        setSavedReflectionSuccess(false);
      }, 3000);
    } catch (error) {
      console.error(
        'Failed to save reflection:',
        error
      );

      alert(
        t(
          'home.saveError',
          'Erro ao salvar sua reflexão.'
        )
      );
    } finally {
      setSavingReflection(false);
    }
  };

  /*
   * ============================================================
   * LOGIN FOR REFLECTION
   * ============================================================
   */

  const handleLoginForReflection = () => {
    const currentUrl = encodeURIComponent(
      window.location.href
    );

    window.location.href =
      `/login?redirectTo=${currentUrl}`;
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="principle-view">

      {/* ========================================================
          HEADER / LOGO
      ========================================================= */}

      <header className="principle-view-header">
        <BrandLogo
          variant="light"
          alt="3 Minutes for Life"
          className="landing-logo-img"
        />
      </header>

      {/* ========================================================
          BACK
      ========================================================= */}

      {onBack && (
        <button
          type="button"
          className="principle-view-back"
          onClick={onBack}
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>

          <span>{t('home.back')}</span>
        </button>
      )}

      {/* ========================================================
          CATEGORY
      ========================================================= */}

      <span className="label">
        {devotional.categories?.name
          ? t(
            `categories.${devotional.categories.name}`,
            devotional.categories.name
          )
          : t(
            'categories.Devocional',
            'Devocional'
          )}
      </span>

      {/* ========================================================
          TITLE
      ========================================================= */}

      <h1 className="principle-title">
        {devotional.title}
      </h1>

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
          AUDIO
      ========================================================= */}

      {devotional.audio_url && (
        <div className="principle-view-audio">
          <audio
            controls
            src={devotional.audio_url}
            aria-label={devotional.title}
          />
        </div>
      )}

      {/* ========================================================
          APPLICATION
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
            <p className="application-pending">
              {t(
                'home.applicationPending'
              )}
            </p>
          )}
        </div>

        {/* ======================================================
            PRAYER
        ====================================================== */}

        {devotional.prayer && (
          <div className="content-section">
            <span className="label">
              {t('home.prayer')}
            </span>

            <div className="application-text prayer-text">
              <HtmlRenderer
                html={devotional.prayer}
              />
            </div>
          </div>
        )}

        {/* ======================================================
            SCRIPTURE
        ====================================================== */}

        {devotional.scripture_reference && (
          <div className="content-section">
            <span className="label">
              {t(
                'home.scriptureReference'
              )}
            </span>

            <p className="scripture-reference">
              {devotional.scripture_reference}
            </p>

            {devotional.scripture_text && (
              <p className="scripture-text">
                &ldquo;
                {devotional.scripture_text}
                &rdquo;
              </p>
            )}
          </div>
        )}

        {/* ======================================================
            PERSONAL REFLECTION
        ====================================================== */}

        <div className="personal-reflection-section">

          <h3 className="personal-reflection-title">
            {t('home.myReflection')}
          </h3>

          <p className="personal-reflection-prompt">
            {t('home.myReflectionPrompt')}
          </p>

          {user ? (
            <div className="personal-reflection-form">

              <textarea
                value={reflectionContent}
                onChange={(event) =>
                  setReflectionContent(
                    event.target.value
                  )
                }
                placeholder={t(
                  'home.myReflectionPlaceholder'
                )}
                className="personal-reflection-input"
                aria-label={t(
                  'home.myReflection'
                )}
              />

              <p className="personal-reflection-private">
                {t(
                  'home.myReflectionPrivate'
                )}
              </p>

              <div className="personal-reflection-actions">

                <button
                  type="button"
                  onClick={
                    handleSaveReflection
                  }
                  disabled={
                    savingReflection ||
                    !reflectionContent.trim()
                  }
                  className="personal-reflection-save"
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
                  <span className="personal-reflection-success">
                    {t(
                      'home.reflectionSaved'
                    )}
                  </span>
                )}

              </div>
            </div>
          ) : (
            <div className="personal-reflection-login">

              <p>
                {t(
                  'home.loginToSave',
                  'Entre para salvar sua reflexão.'
                )}
              </p>

              <button
                type="button"
                className="btn-secondary"
                onClick={
                  handleLoginForReflection
                }
              >
                {t(
                  'home.login',
                  'Entrar'
                )}
              </button>

            </div>
          )}
        </div>

        {/* ======================================================
            SHARED CTA
        ====================================================== */}

        {customAction?.variant ===
          'shared' && (
            <div className="shared-devotional-cta">

              {customAction.text && (
                <p className="shared-devotional-cta-text">
                  {customAction.text}
                </p>
              )}

              {customAction.subtext && (
                <p className="shared-devotional-cta-subtext">
                  {customAction.subtext}
                </p>
              )}

              <button
                type="button"
                className="shared-devotional-cta-button"
                onClick={
                  customAction.onClick
                }
              >
                {customAction.label}
              </button>

              {customAction.note && (
                <p className="shared-devotional-cta-note">
                  {customAction.note}
                </p>
              )}

            </div>
          )}

        {/* ======================================================
            ACTION BAR
        ====================================================== */}

        <div className="action-bar">

          {customAction &&
            customAction.variant !==
            'shared' ? (
            <button
              type="button"
              className="action-btn"
              onClick={
                customAction.onClick
              }
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                />

                <path d="M12 8v8M8 12h8" />
              </svg>

              <span className="action-label">
                {customAction.label}
              </span>
            </button>
          ) : !customAction ? (
            <>
              {/* SAVE */}

              <button
                type="button"
                className={`action-btn ${saved ? 'active' : ''
                  }`}
                onClick={toggleSave}
                aria-label={
                  saved
                    ? t('saved')
                    : t('save')
                }
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
                type="button"
                className="action-btn"
                onClick={markComplete}
                aria-label={t(
                  'complete'
                )}
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
            </>
          ) : null}

          {/* SHARE */}

          <ShareButton
            devotional={devotional}
            asIcon={true}
          />

        </div>

        {/* ======================================================
            RELATIONSHIP
        ====================================================== */}

        <RelationshipSection
          devotionalId={devotional.id}
        />

      </div>
    </div>
  );
}
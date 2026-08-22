import { useEffect, useState } from 'react';
import type { Devotional } from '../types/Devotional';
import { JourneyService } from '../services/JourneyService';
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
  showLogo?: boolean;
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
  showLogo = true,
  customAction,
}: PrincipleViewProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [saved, setSaved] = useState(false);
  const [reflectionContent, setReflectionContent] = useState('');
  const [savingReflection, setSavingReflection] = useState(false);
  const [savedReflectionSuccess, setSavedReflectionSuccess] =
    useState(false);

  /*
   * ============================================================
   * INITIALIZATION
   * ============================================================
   */

  useEffect(() => {
    let mounted = true;

    JourneyService.start(devotional.id).catch(console.error);

    JourneyService.listFavorites()
      .then((ids) => {
        if (mounted) {
          setSaved(ids.includes(devotional.id));
        }
      })
      .catch(console.error);

    if (user) {
      ReflectionService.getReflection(devotional.id)
        .then((content) => {
          if (mounted) {
            setReflectionContent(content || '');
          }
        })
        .catch(console.error);
    } else {
      setReflectionContent('');
    }

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
      const isSaved = await JourneyService.toggleFavorite(
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
   * COMPLETE
   * ============================================================
   */

  const markComplete = async () => {
    try {
      await JourneyService.complete(devotional.id);
      alert(t('completed'));
    } catch (err) {
      console.error(err);
    }
  };

  /*
   * ============================================================
   * PERSONAL REFLECTION
   * ============================================================
   */

  const handleSaveReflection = async () => {
    const content = reflectionContent.trim();

    if (!content || !user) {
      return;
    }

    setSavingReflection(true);

    try {
      await ReflectionService.saveReflection(
        devotional.id,
        content
      );

      setSavedReflectionSuccess(true);

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
    <article
      className="principle-view"
      style={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        overflowX: 'hidden',
        overflowWrap: 'break-word',
      }}
    >
      {/* ========================================================
          HEADER / LOGO
          ======================================================== */}

      {showLogo && (
        <header
          className="principle-view-header"
          style={{
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            margin: 0,
            padding: 0,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            boxSizing: 'border-box',
            overflow: 'visible',
          }}
        >
          <BrandLogo
            variant="light"
            alt="3 Minutes for Life"
            className="principle-view-logo"
            style={{
              width: '160px',
              height: 'auto',
              maxWidth: '160px',
              display: 'block',
              flex: '0 0 auto',
              margin: '1rem 0 2.5rem 0',
            }}
          />
        </header>
      )}

      {/* ========================================================
          BACK
          ======================================================== */}

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '0 0 2rem 0',
            padding: 0,
            maxWidth: '100%',
            color: 'var(--color-text-light)',
            boxSizing: 'border-box',
          }}
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

          {t('home.back')}
        </button>
      )}

      {/* ========================================================
          DEVOTIONAL CONTENT
          ======================================================== */}

      <div
        className="principle-view-content"
        style={{
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
          overflowWrap: 'break-word',
        }}
      >
        {/* ======================================================
            CATEGORY
            ====================================================== */}

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

        {/* ======================================================
            TITLE
            ====================================================== */}

        <h1
          className="principle-title"
          style={{
            width: '100%',
            maxWidth: '100%',
            margin: 0,
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          }}
        >
          {devotional.title}
        </h1>

        {/* ======================================================
            PRINCIPLE STATEMENT
            ====================================================== */}

        {devotional.principle_statement && (
          <p
            className="principle-statement"
            style={{
              width: '100%',
              maxWidth: '100%',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            }}
          >
            {devotional.principle_statement}
          </p>
        )}

        {/* ======================================================
            REFLECTION
            ====================================================== */}

        <div
          className="principle-reflection-wrapper"
          style={{
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            overflowWrap: 'break-word',
          }}
        >
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
        </div>

        {/* ======================================================
            AUDIO
            ====================================================== */}

        {devotional.audio_url && (
          <div
            className="principle-audio"
            style={{
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              marginBottom: '2rem',
              boxSizing: 'border-box',
            }}
          >
            <audio
              controls
              src={devotional.audio_url}
              style={{
                display: 'block',
                width: '100%',
                maxWidth: '100%',
                height: '40px',
              }}
            />
          </div>
        )}

        {/* ======================================================
            APPLICATION
            ====================================================== */}

        <section
          className="application-section"
          style={{
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
          }}
        >
          <span className="label">
            {t('home.practiceToday')}
          </span>

          <div
            className="application-text"
            style={{
              width: '100%',
              maxWidth: '100%',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              boxSizing: 'border-box',
            }}
          >
            {devotional.practical_application ? (
              <HtmlRenderer
                html={devotional.practical_application}
              />
            ) : (
              <p
                style={{
                  marginBottom: '1rem',
                  fontStyle: 'italic',
                  opacity: 0.7,
                }}
              >
                {t('home.applicationPending')}
              </p>
            )}
          </div>

          {/* ====================================================
              PRAYER
              ==================================================== */}

          {devotional.prayer && (
            <div
              className="principle-secondary-section"
              style={{
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop:
                  '1px solid var(--color-border)',
                boxSizing: 'border-box',
              }}
            >
              <span className="label">
                {t('home.prayer')}
              </span>

              <div
                className="application-text"
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  fontStyle: 'italic',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                }}
              >
                <HtmlRenderer
                  html={devotional.prayer}
                />
              </div>
            </div>
          )}

          {/* ====================================================
              SCRIPTURE
              ==================================================== */}

          {devotional.scripture_reference && (
            <div
              className="principle-secondary-section"
              style={{
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop:
                  '1px solid var(--color-border)',
                boxSizing: 'border-box',
              }}
            >
              <span className="label">
                {t(
                  'home.scriptureReference'
                )}
              </span>

              <p
                style={{
                  maxWidth: '100%',
                  fontWeight: 500,
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                }}
              >
                {devotional.scripture_reference}
              </p>

              {devotional.scripture_text && (
                <p
                  style={{
                    maxWidth: '100%',
                    marginTop: '0.5rem',
                    lineHeight: 1.6,
                    color:
                      'var(--color-text-light)',
                    fontSize: '0.95rem',
                    overflowWrap: 'break-word',
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
              MY REFLECTION
              ==================================================== */}

          <section
            className="my-reflection-section"
            style={{
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              marginTop: '2.5rem',
              marginBottom: '2.5rem',
              paddingTop: '2rem',
              borderTop:
                '1px solid var(--color-border)',
              boxSizing: 'border-box',
            }}
          >
            <h3
              style={{
                maxWidth: '100%',
                marginBottom: '0.5rem',
                fontSize: '1.2rem',
                fontWeight: 600,
                overflowWrap: 'break-word',
              }}
            >
              {t('home.myReflection')}
            </h3>

            <p
              style={{
                maxWidth: '100%',
                marginBottom: '1.5rem',
                fontSize: '0.95rem',
                color:
                  'var(--color-text-light)',
                lineHeight: 1.5,
                overflowWrap: 'break-word',
              }}
            >
              {t('home.myReflectionPrompt')}
            </p>

            {/* ==================================================
                AUTHENTICATED USER
                ================================================== */}

            {user ? (
              <div
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  boxSizing: 'border-box',
                }}
              >
                <textarea
                  value={reflectionContent}
                  onChange={(event) =>
                    setReflectionContent(
                      event.target.value
                    )
                  }
                  placeholder={t(
                    'home.myReflectionPlaceholder',
                    'Escreva aqui o que esta reflexão despertou em você...'
                  )}
                  style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    minHeight: '120px',
                    padding: '1rem',
                    border:
                      '1px solid var(--color-border)',
                    borderRadius: '12px',
                    background:
                      'var(--color-bg)',
                    color:
                      'var(--color-text)',
                    fontSize: '1rem',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />

                <p
                  style={{
                    maxWidth: '100%',
                    marginTop: '-0.5rem',
                    fontSize: '0.8rem',
                    color:
                      'var(--color-text-light)',
                    fontStyle: 'italic',
                    overflowWrap: 'break-word',
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
                    flexWrap: 'wrap',
                    maxWidth: '100%',
                    minWidth: 0,
                    marginTop: '0.5rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={
                      handleSaveReflection
                    }
                    disabled={
                      savingReflection ||
                      !reflectionContent.trim()
                    }
                    style={{
                      maxWidth: '100%',
                      padding:
                        '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '24px',
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
                      boxSizing: 'border-box',
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
                        maxWidth: '100%',
                        fontSize: '0.9rem',
                        color: '#4CAF50',
                        fontWeight: 500,
                        overflowWrap:
                          'break-word',
                      }}
                    >
                      {t(
                        'home.reflectionSaved'
                      )}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* ==================================================
                 VISITOR
                 ================================================== */

              <div
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  padding: '1.5rem',
                  border:
                    '1px solid var(--color-border)',
                  borderRadius: '12px',
                  background:
                    'rgba(0, 0, 0, 0.02)',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}
              >
                <button
                  type="button"
                  onClick={
                    handleLoginForReflection
                  }
                  style={{
                    maxWidth: '100%',
                    padding:
                      '0.75rem 1.5rem',
                    border:
                      '1px solid var(--color-text)',
                    borderRadius: '24px',
                    background:
                      'transparent',
                    color:
                      'var(--color-text)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                >
                  {t(
                    'home.loginToSave'
                  )}
                </button>
              </div>
            )}
          </section>

          {/* ====================================================
              SHARED CTA
              ==================================================== */}

          {customAction?.variant === 'shared' && (
            <section
              className="shared-cta"
              style={{
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                marginTop: '3rem',
                padding: '2rem 1.5rem',
                border:
                  '1px solid var(--color-border)',
                borderRadius: '16px',
                background:
                  'var(--color-bg)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem',
                boxSizing: 'border-box',
                overflow: 'hidden',
              }}
            >
              {customAction.text && (
                <p
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    margin: 0,
                    fontSize: '1.25rem',
                    color:
                      'var(--color-text)',
                    lineHeight: 1.5,
                    fontWeight: 500,
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  {customAction.text}
                </p>
              )}

              {customAction.subtext && (
                <p
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    margin: 0,
                    fontSize: '1.1rem',
                    color:
                      'var(--color-text-light)',
                    lineHeight: 1.5,
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  {customAction.subtext}
                </p>
              )}

              <button
                type="button"
                onClick={
                  customAction.onClick
                }
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  padding: '1rem 2rem',
                  border: 'none',
                  borderRadius: '30px',
                  background:
                    'var(--color-text)',
                  color:
                    'var(--color-bg)',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  transition:
                    'opacity 0.2s',
                  boxSizing: 'border-box',
                }}
              >
                {customAction.label}
              </button>

              {customAction.note && (
                <p
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    margin: 0,
                    fontSize: '0.9rem',
                    color:
                      'var(--color-text-light)',
                    lineHeight: 1.5,
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  {customAction.note}
                </p>
              )}
            </section>
          )}

          {/* ====================================================
              ACTION BAR
              ==================================================== */}

          <div
            className="action-bar"
            style={{
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              overflow: 'visible',
            }}
          >
            {/* ==================================================
                CUSTOM ACTION
                ================================================== */}

            {customAction &&
              customAction.variant !== 'shared' ? (
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
                {/* ==========================================
                    SAVE
                    ========================================== */}

                <button
                  type="button"
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

                {/* ==========================================
                    COMPLETE
                    ========================================== */}

                <button
                  type="button"
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
              </>
            ) : null}

            {/* ==================================================
                SHARE
                ================================================== */}

            <ShareButton
              devotional={devotional}
              asIcon={true}
            />
          </div>

          {/* ====================================================
              RELATIONSHIP
              ==================================================== */}

          <div
            className="relationship-section-wrapper"
            style={{
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              overflow: 'visible',
            }}
          >
            <RelationshipSection
              devotionalId={devotional.id}
            />
          </div>
        </section>
      </div>
    </article>
  );
}
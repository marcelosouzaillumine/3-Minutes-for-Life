import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Devotional } from '../types/Devotional';
import { JourneyService } from '../services/JourneyService';
import { useTranslation } from 'react-i18next';
import { ShareButton } from './ShareButton';
import { HtmlRenderer } from './HtmlRenderer';
import { useAuth } from '../context/AuthContext';
import { ReflectionService } from '../services/ReflectionService';
import { RelationshipSection } from './RelationshipSection';
import { CtaEngine } from '../services/CtaEngine';
import { DevotionalHeader } from './DevotionalHeader';

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
  onExplore?: () => void;
}

export function PrincipleView({
  devotional,
  onBack,
  showLogo = true,
  customAction,
  onExplore,
}: PrincipleViewProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

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

    JourneyService.start(devotional.id, devotional.legacy_id).catch(console.error);

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
        devotional.id,
        devotional.legacy_id
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
      await JourneyService.complete(devotional.id, devotional.legacy_id);
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
    const currentUrl = encodeURIComponent(window.location.href);
    navigate(`/login?redirectTo=${currentUrl}`);
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <article className="devotional">

      <DevotionalHeader
        showLogo={showLogo}
        onBack={onBack}
        backText={t('home.back')}
      />

      {/* ========================================================
          MAIN CONTENT
          ======================================================== */}

      <div className="devotional-content">

        {/* ======================================================
            INTRODUCTION
            Categoria → Título → Princípio → Reflexão
            ====================================================== */}

        <section className="principle-introduction">

          <span className="principle-category label">
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

          <h1 className="principle-title">
            {devotional.title}
          </h1>

          {devotional.principle_statement && (
            <p className="principle-statement">
              {devotional.principle_statement}
            </p>
          )}

          <div className="principle-reflection-wrapper">
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

        </section>

        {/* ======================================================
            SCRIPTURE
            IMEDIATAMENTE APÓS A REFLEXÃO
            ====================================================== */}

        {(devotional.scripture_reference ||
          devotional.scripture_text) && (
            <section className="principle-scripture-section">

              {devotional.scripture_reference && (
                <>
                  <span className="principle-section-label">
                    {t(
                      'home.scriptureReference',
                      'Referência bíblica'
                    )}
                  </span>

                  <p className="principle-scripture-reference">
                    {devotional.scripture_reference}
                  </p>
                </>
              )}

              {devotional.scripture_text && (
                <p className="principle-scripture-text">
                  &ldquo;
                  {devotional.scripture_text}
                  &rdquo;
                </p>
              )}

            </section>
          )}

        {/* ======================================================
            AUDIO
            ====================================================== */}

        {devotional.audio_url && (
          <section className="principle-audio-section">

            <span className="principle-section-label">
              {t(
                'home.audio',
                'Ouvir reflexão'
              )}
            </span>

            <audio
              className="principle-audio-player"
              controls
              src={devotional.audio_url}
            />

          </section>
        )}

        {/* ======================================================
            PRACTICE
            ====================================================== */}

        <section className="principle-practice-section">

          <span className="principle-section-label">
            {t(
              'home.practiceToday',
              'Prática de hoje'
            )}
          </span>

          <div className="principle-practice-text">
            {devotional.practical_application ? (
              <HtmlRenderer
                html={devotional.practical_application}
              />
            ) : (
              <p className="application-pending">
                {t(
                  'home.applicationPending',
                  'Esta prática será disponibilizada em breve.'
                )}
              </p>
            )}
          </div>

        </section>

        {/* ======================================================
            PRAYER
            ====================================================== */}

        {devotional.prayer && (
          <section className="principle-prayer-section">

            <span className="principle-section-label">
              {t(
                'home.prayer',
                'Oração'
              )}
            </span>

            <div className="principle-prayer-text">
              <HtmlRenderer
                html={devotional.prayer}
              />
            </div>

          </section>
        )}

        {/* ======================================================
            MY REFLECTION
            ====================================================== */}

        <section className="my-reflection-section">

          <h3>
            {t(
              'home.myReflection',
              'Minha reflexão'
            )}
          </h3>

          <p className="my-reflection-prompt">
            {t(
              'home.myReflectionPrompt'
            )}
          </p>

          {user ? (
            <div className="my-reflection-authenticated">

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
                className="my-reflection-input"
              />

              <p className="my-reflection-private">
                {t(
                  'home.myReflectionPrivate'
                )}
              </p>

              <div className="my-reflection-actions">

                <button
                  type="button"
                  onClick={handleSaveReflection}
                  disabled={
                    savingReflection ||
                    !reflectionContent.trim()
                  }
                  className="my-reflection-save"
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
                  <span className="reflection-success">
                    {t(
                      'home.reflectionSaved'
                    )}
                  </span>
                )}

              </div>

            </div>
          ) : (
            <div className="my-reflection-visitor">

              <button
                type="button"
                onClick={
                  handleLoginForReflection
                }
                className="my-reflection-login"
              >
                {t(
                  'home.loginToSave'
                )}
              </button>

            </div>
          )}

        </section>

        {/* ======================================================
            CONTENT TIP (opcional — texto + imagem 4:5 opcional)
            ====================================================== */}

        {(devotional.content_tip || devotional.content_tip_image_url) && (
          <section className="principle-tip-section">

            <span className="principle-section-label">
              {t(
                'home.contentTip',
                'Uma dica para você'
              )}
            </span>

            <div
              className={
                devotional.content_tip_image_url
                  ? 'principle-tip-row principle-tip-row--with-image'
                  : 'principle-tip-row'
              }
            >

              {devotional.content_tip && (
                <div className="principle-tip-text">
                  <HtmlRenderer
                    html={devotional.content_tip}
                  />
                </div>
              )}

              {devotional.content_tip_image_url && (
                devotional.content_tip_url ? (
                  <a
                    href={devotional.content_tip_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="principle-tip-image-link"
                    aria-label={t('home.contentTip', 'Uma dica para você')}
                  >
                    <img
                      src={devotional.content_tip_image_url}
                      alt=""
                      className="principle-tip-image"
                    />
                  </a>
                ) : (
                  <img
                    src={devotional.content_tip_image_url}
                    alt=""
                    className="principle-tip-image"
                  />
                )
              )}

            </div>

          </section>
        )}

        {/* ======================================================
            SUPPORT MESSAGE (opcional — banner e/ou texto)
            ====================================================== */}

        {(devotional.support_message || devotional.support_banner_url) && (
          <section className="principle-support-section">

            <span className="principle-section-label">
              {t(
                'home.supportMessage',
                'Apoie o projeto'
              )}
            </span>

            {devotional.support_banner_url && (
              devotional.support_link_url ? (
                <a
                  href={devotional.support_link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="principle-support-banner-link"
                  aria-label={t('home.supportLinkLabel', 'Quero apoiar')}
                >
                  <img
                    src={devotional.support_banner_url}
                    alt=""
                    className="principle-support-banner"
                  />
                </a>
              ) : (
                <img
                  src={devotional.support_banner_url}
                  alt=""
                  className="principle-support-banner"
                />
              )
            )}

            {devotional.support_message && (
              <div className="principle-support-text">
                <HtmlRenderer
                  html={devotional.support_message}
                />
              </div>
            )}

            {/* O botão só aparece quando NÃO há banner clicável: com os
                dois, a mesma ação teria dois CTAs concorrendo. */}
            {devotional.support_link_url && !devotional.support_banner_url && (
              <a
                href={devotional.support_link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="principle-support-button"
              >
                {t(
                  'home.supportLinkLabel',
                  'Quero apoiar'
                )}
              </a>
            )}

          </section>
        )}

        {/* ======================================================
            SHARED CTA
            ====================================================== */}

        {customAction?.variant === 'shared' && (
          <section className="shared-cta">

            {customAction.text && (
              <p className="shared-cta-text">
                {customAction.text}
              </p>
            )}

            {customAction.subtext && (
              <p className="shared-cta-subtext">
                {customAction.subtext}
              </p>
            )}

            <button
              type="button"
              onClick={
                customAction.onClick
              }
              className="shared-cta-button"
            >
              {customAction.label}
            </button>

            {customAction.note && (
              <p className="shared-cta-note">
                {customAction.note}
              </p>
            )}

          </section>
        )}

        {/* ======================================================
            ACTION BAR
            ====================================================== */}

        <div className="action-bar">

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

              {/* SAVE */}

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

              {/* COMPLETE */}

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

          <ShareButton
            devotional={devotional}
            asIcon={true}
          />

        </div>

        {/* ======================================================
            RELATIONSHIP
            ====================================================== */}

        <div className="relationship-section-wrapper">
          <RelationshipSection
            devotionalId={devotional.id}
          />
        </div>

        {/* ======================================================
            EXPLORE MORE
            ====================================================== */}

        {onExplore && (
          <div className="home-explore">
            <button
              type="button"
              className="btn-secondary"
              onClick={onExplore}
            >
              {t('home.exploreMore', 'Explorar mais')}
            </button>
          </div>
        )}

      </div>
    </article>
  );
}
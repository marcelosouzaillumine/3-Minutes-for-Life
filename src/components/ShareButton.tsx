import React, { useState } from 'react';
import { AnalyticsService } from '../services/AnalyticsService';
import { useAuth } from '../context/AuthContext';
import type {
  Devotional,
  ResolvedShareAsset,
} from '../types/Devotional';
import { useTranslation } from 'react-i18next';

interface ShareButtonProps {
  devotional: Devotional;
  asIcon?: boolean;
}

/*
 * ============================================================
 * FETCH IMAGE AS FILE
 * ============================================================
 */

async function fetchAsFile(
  url: string,
  filename: string
): Promise<File | null> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();

    return new File(
      [blob],
      filename,
      {
        type: blob.type,
      }
    );
  } catch {
    return null;
  }
}

/*
 * ============================================================
 * BUILD SHARE URL
 * ============================================================
 */

function buildShareUrl(
  devotionalId: string,
  referralCode: string,
  language: string
): string {
  const baseUrl =
    window.location.hostname === 'localhost'
      ? window.location.origin
      : 'https://www.3minutesforlife.com';

  return `${baseUrl}/r/${referralCode}?d=${devotionalId}&lang=${language}`;
}

/*
 * ============================================================
 * SHARE BUTTON
 * ============================================================
 */

export const ShareButton: React.FC<ShareButtonProps> = ({
  devotional,
  asIcon = false,
}) => {
  const { t, i18n } =
    useTranslation('common');

  const { session } = useAuth();

  const [isSharing, setIsSharing] =
    useState(false);

  const [showPanel, setShowPanel] =
    useState(false);

  /*
   * ==========================================================
   * INVALID DEVOTIONAL
   * ==========================================================
   */

  if (
    !devotional.id ||
    devotional.id.includes('fallback') ||
    devotional.id === 'undefined'
  ) {
    return null;
  }

  /*
   * ==========================================================
   * SHARE ASSETS
   * ==========================================================
   */

  const shareAssets:
    | ResolvedShareAsset
    | null =
    devotional.share_assets ?? null;

  const hasWhatsApp =
    !!shareAssets?.whatsapp_text?.trim();

  const hasFeed =
    !!shareAssets?.feed_image_url;

  const hasStory =
    !!shareAssets?.story_image_url;

  /*
   * Facebook uses Feed image according
   * to the current architecture.
   */
  const hasFacebook = hasFeed;

  const hasAnyAsset =
    hasWhatsApp ||
    hasFeed ||
    hasStory;

  const whatsappImageUrl =
    shareAssets?.whatsapp_image_url ||
    shareAssets?.feed_image_url ||
    null;

  const hasDownloadableImage =
    !!whatsappImageUrl ||
    hasFeed ||
    hasStory;

  /*
   * ==========================================================
   * REFERRAL CODE
   * ==========================================================
   */

  const getReferralCode =
    async (): Promise<string> => {
      if (session?.user?.id) {
        try {
          const {
            supabase,
          } = await import(
            '../lib/supabase'
          );

          const {
            data,
          } = await supabase
            .from('profiles')
            .select(
              'referral_code'
            )
            .eq(
              'id',
              session.user.id
            )
            .single();

          if (
            data?.referral_code
          ) {
            return data.referral_code;
          }
        } catch {
          /*
           * Silently use fallback.
           */
        }
      }

      return '3MIN';
    };

  /*
   * ==========================================================
   * TRACK SHARE
   * ==========================================================
   */

  const trackShare = async (
    channel: string,
    referralCode: string,
    hasImage: boolean
  ) => {
    await AnalyticsService.trackEvent(
      'content_shared',
      {
        devotional_id:
          devotional.id,

        channel,

        has_editorial_text:
          hasWhatsApp,

        has_editorial_image:
          hasImage,

        referral_code:
          referralCode,

        language:
          i18n.language,
      }
    );
  };

  /*
   * ==========================================================
   * WHATSAPP
   * ==========================================================
   */

  const handleWhatsApp =
    async () => {
      if (!hasWhatsApp) {
        return;
      }

      setIsSharing(true);

      try {
        const referralCode =
          await getReferralCode();

        const shareUrl =
          buildShareUrl(
            devotional.id,
            referralCode,
            i18n.language
          );

        const text =
          shareAssets!
            .whatsapp_text!
            .replace(
              '{{link}}',
              shareUrl
            );

        let imageFile:
          | File
          | null = null;

        if (whatsappImageUrl) {
          imageFile =
            await fetchAsFile(
              whatsappImageUrl,
              'reflexao-whatsapp.jpg'
            );
        }

        await trackShare(
          'whatsapp',
          referralCode,
          !!imageFile
        );

        const isMobile =
          /iPhone|iPad|iPod|Android/i.test(
            navigator.userAgent
          );

        /*
         * Mobile:
         * Try native share with image + text.
         */
        if (isMobile) {
          if (
            imageFile &&
            navigator.canShare &&
            navigator.canShare({
              files: [imageFile],
            })
          ) {
            try {
              await navigator.share({
                files: [imageFile],
                text,
              });

              return;
            } catch (error) {
              if (
                error instanceof Error &&
                error.name ===
                'AbortError'
              ) {
                return;
              }
            }
          }

          /*
           * Fallback:
           * Native share with text only.
           */
          if (
            navigator.share
          ) {
            try {
              await navigator.share({
                text,
              });

              return;
            } catch (error) {
              if (
                error instanceof Error &&
                error.name ===
                'AbortError'
              ) {
                return;
              }
            }
          }
        }

        /*
         * Desktop fallback.
         */
        window.open(
          `https://api.whatsapp.com/send?text=${encodeURIComponent(
            text
          )}`,
          '_blank'
        );
      } catch (error) {
        console.error(
          'WhatsApp share error:',
          error
        );
      } finally {
        setIsSharing(false);
      }
    };

  /*
   * ==========================================================
   * INSTAGRAM FEED
   * ==========================================================
   */

  const handleInstagramFeed =
    async () => {
      if (!hasFeed) {
        return;
      }

      setIsSharing(true);

      try {
        const referralCode =
          await getReferralCode();

        await trackShare(
          'instagram_feed',
          referralCode,
          true
        );

        const imageFile =
          await fetchAsFile(
            shareAssets!
              .feed_image_url!,
            'reflexao-feed.jpg'
          );

        if (!imageFile) {
          alert(
            t(
              'shareActions.imageError',
              'Não foi possível carregar a imagem.'
            )
          );

          return;
        }

        const isMobile =
          /iPhone|iPad|iPod|Android/i.test(
            navigator.userAgent
          );

        if (
          isMobile &&
          navigator.canShare &&
          navigator.canShare({
            files: [imageFile],
          })
        ) {
          try {
            await navigator.share({
              files: [imageFile],
            });

            return;
          } catch (error) {
            if (
              error instanceof Error &&
              error.name ===
              'AbortError'
            ) {
              return;
            }
          }
        }

        /*
         * Desktop fallback:
         * download image.
         */
        const objectUrl =
          URL.createObjectURL(
            imageFile
          );

        const anchor =
          document.createElement(
            'a'
          );

        anchor.href =
          objectUrl;

        anchor.download =
          imageFile.name;

        document.body.appendChild(
          anchor
        );

        anchor.click();

        anchor.remove();

        URL.revokeObjectURL(
          objectUrl
        );

        alert(
          t(
            'shareActions.instagramDownloadAlert',
            'Imagem baixada. Publique manualmente no Instagram.'
          )
        );
      } catch (error) {
        console.error(
          'Instagram Feed error:',
          error
        );
      } finally {
        setIsSharing(false);
      }
    };

  /*
   * ==========================================================
   * INSTAGRAM STORY
   * ==========================================================
   */

  const handleInstagramStory =
    async () => {
      if (!hasStory) {
        return;
      }

      setIsSharing(true);

      try {
        const referralCode =
          await getReferralCode();

        await trackShare(
          'instagram_story',
          referralCode,
          true
        );

        const imageFile =
          await fetchAsFile(
            shareAssets!
              .story_image_url!,
            'reflexao-story.jpg'
          );

        if (!imageFile) {
          alert(
            t(
              'shareActions.imageError',
              'Não foi possível carregar a imagem.'
            )
          );

          return;
        }

        const isMobile =
          /iPhone|iPad|iPod|Android/i.test(
            navigator.userAgent
          );

        if (
          isMobile &&
          navigator.canShare &&
          navigator.canShare({
            files: [imageFile],
          })
        ) {
          try {
            await navigator.share({
              files: [imageFile],
            });

            return;
          } catch (error) {
            if (
              error instanceof Error &&
              error.name ===
              'AbortError'
            ) {
              return;
            }
          }
        }

        /*
         * Desktop fallback:
         * download image.
         */
        const objectUrl =
          URL.createObjectURL(
            imageFile
          );

        const anchor =
          document.createElement(
            'a'
          );

        anchor.href =
          objectUrl;

        anchor.download =
          imageFile.name;

        document.body.appendChild(
          anchor
        );

        anchor.click();

        anchor.remove();

        URL.revokeObjectURL(
          objectUrl
        );

        alert(
          t(
            'shareActions.instagramDownloadAlert',
            'Imagem baixada. Publique manualmente no Instagram.'
          )
        );
      } catch (error) {
        console.error(
          'Instagram Story error:',
          error
        );
      } finally {
        setIsSharing(false);
      }
    };

  /*
   * ==========================================================
   * FACEBOOK
   * ==========================================================
   */

  const handleFacebook =
    async () => {
      if (!hasFacebook) {
        return;
      }

      setIsSharing(true);

      try {
        const referralCode =
          await getReferralCode();

        const shareUrl =
          buildShareUrl(
            devotional.id,
            referralCode,
            i18n.language
          );

        await trackShare(
          'facebook',
          referralCode,
          true
        );

        const fbImageUrl =
          shareAssets?.feed_image_url;

        const imageFile =
          fbImageUrl
            ? await fetchAsFile(
              fbImageUrl,
              'reflexao-facebook.jpg'
            )
            : null;

        const isMobile =
          /iPhone|iPad|iPod|Android/i.test(
            navigator.userAgent
          );

        if (
          isMobile &&
          imageFile &&
          navigator.canShare &&
          navigator.canShare({
            files: [imageFile],
          })
        ) {
          try {
            await navigator.share({
              files: [imageFile],
            });

            return;
          } catch (error) {
            if (
              error instanceof Error &&
              error.name ===
              'AbortError'
            ) {
              return;
            }
          }
        }

        /*
         * Desktop fallback.
         */
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            shareUrl
          )}`,
          '_blank',
          'width=600,height=400'
        );
      } catch (error) {
        console.error(
          'Facebook share error:',
          error
        );
      } finally {
        setIsSharing(false);
      }
    };

  /*
   * ==========================================================
   * DOWNLOAD
   * ==========================================================
   */

  const handleDownload =
    async () => {
      if (!hasDownloadableImage) {
        return;
      }

      setIsSharing(true);

      try {
        const referralCode =
          await getReferralCode();

        await trackShare(
          'download',
          referralCode,
          true
        );

        const downloadUrl =
          whatsappImageUrl ||
          shareAssets?.feed_image_url ||
          shareAssets?.story_image_url;

        if (!downloadUrl) {
          return;
        }

        const imageFile =
          await fetchAsFile(
            downloadUrl,
            'reflexao-3min.jpg'
          );

        if (!imageFile) {
          alert(
            t(
              'shareActions.imageError',
              'Não foi possível carregar a imagem.'
            )
          );

          return;
        }

        const objectUrl =
          URL.createObjectURL(
            imageFile
          );

        const anchor =
          document.createElement(
            'a'
          );

        anchor.href =
          objectUrl;

        anchor.download =
          imageFile.name;

        document.body.appendChild(
          anchor
        );

        anchor.click();

        anchor.remove();

        URL.revokeObjectURL(
          objectUrl
        );
      } catch (error) {
        console.error(
          'Download error:',
          error
        );
      } finally {
        setIsSharing(false);
      }
    };

  /*
   * ==========================================================
   * PANEL
   * ==========================================================
   */

  const panel = showPanel ? (
    <SharePanel
      hasWhatsApp={hasWhatsApp}
      hasFeed={hasFeed}
      hasStory={hasStory}
      hasFacebook={hasFacebook}
      hasAnyAsset={hasAnyAsset}
      hasSomethingToDownload={
        hasDownloadableImage
      }
      isSharing={isSharing}
      onWhatsApp={() => {
        setShowPanel(false);
        handleWhatsApp();
      }}
      onInstagramFeed={() => {
        setShowPanel(false);
        handleInstagramFeed();
      }}
      onInstagramStory={() => {
        setShowPanel(false);
        handleInstagramStory();
      }}
      onFacebook={() => {
        setShowPanel(false);
        handleFacebook();
      }}
      onDownload={() => {
        setShowPanel(false);
        handleDownload();
      }}
      onClose={() =>
        setShowPanel(false)
      }
      t={t}
    />
  ) : null;

  /*
   * ==========================================================
   * ICON VERSION
   * ==========================================================
   */

  if (asIcon) {
    return (
      <div
        style={{
          position: 'relative',
          display: 'flex',
        }}
      >
        <button
          type="button"
          onClick={() =>
            setShowPanel(
              (previous) =>
                !previous
            )
          }
          disabled={isSharing}
          className="action-btn"
          aria-label={t(
            'shareActions.actionLabel',
            'Compartilhar'
          )}
          aria-expanded={
            showPanel
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <circle
              cx="18"
              cy="5"
              r="3"
            />

            <circle
              cx="6"
              cy="12"
              r="3"
            />

            <circle
              cx="18"
              cy="19"
              r="3"
            />

            <line
              x1="8.59"
              y1="13.51"
              x2="15.42"
              y2="17.49"
            />

            <line
              x1="15.41"
              y1="6.51"
              x2="8.59"
              y2="10.49"
            />
          </svg>

          <span className="action-label">
            {t(
              'shareActions.actionLabel',
              'Compartilhar'
            )}
          </span>
        </button>

        {panel}
      </div>
    );
  }

  /*
   * ==========================================================
   * STANDARD BUTTON
   * ==========================================================
   */

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
      }}
    >
      <button
        type="button"
        onClick={() =>
          setShowPanel(
            (previous) =>
              !previous
          )
        }
        disabled={isSharing}
        className="btn-secondary"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: 'center',
          width: '100%',
        }}
        aria-expanded={
          showPanel
        }
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle
            cx="18"
            cy="5"
            r="3"
          />

          <circle
            cx="6"
            cy="12"
            r="3"
          />

          <circle
            cx="18"
            cy="19"
            r="3"
          />

          <line
            x1="8.59"
            y1="13.51"
            x2="15.42"
            y2="17.49"
          />

          <line
            x1="15.41"
            y1="6.51"
            x2="8.59"
            y2="10.49"
          />
        </svg>

        {isSharing
          ? t(
            'shareActions.buttonLoading',
            'Compartilhando...'
          )
          : t(
            'shareActions.button',
            'Compartilhar'
          )}
      </button>

      {panel}
    </div>
  );
};

/*
 * ============================================================
 * SHARE PANEL
 * ============================================================
 */

interface SharePanelProps {
  hasWhatsApp: boolean;
  hasFeed: boolean;
  hasStory: boolean;
  hasFacebook: boolean;
  hasAnyAsset: boolean;
  hasSomethingToDownload: boolean;
  isSharing: boolean;

  onWhatsApp: () => void;
  onInstagramFeed: () => void;
  onInstagramStory: () => void;
  onFacebook: () => void;
  onDownload: () => void;
  onClose: () => void;

  t: (
    key: string,
    options?: any
  ) => string;
}

const SharePanel: React.FC<
  SharePanelProps
> = ({
  hasWhatsApp,
  hasFeed,
  hasStory,
  hasFacebook,
  hasAnyAsset,
  hasSomethingToDownload,
  isSharing,
  onWhatsApp,
  onInstagramFeed,
  onInstagramStory,
  onFacebook,
  onDownload,
  onClose,
  t,
}) => {
    return (
      <>
        {/* ======================================================
          BACKDROP
      ======================================================= */}

        <div
          onClick={onClose}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,

            background:
              'rgba(0, 0, 0, 0.18)',

            zIndex: 9998,
          }}
        />

        {/* ======================================================
          PANEL
      ======================================================= */}

        <div
          role="dialog"
          aria-modal="true"
          aria-label={t(
            'shareActions.title',
            {
              defaultValue:
                'Compartilhar',
            }
          )}
          style={{
            position: 'fixed',

            left: '50%',
            bottom: '16px',

            transform:
              'translateX(-50%)',

            width:
              'min(420px, calc(100vw - 32px))',

            maxWidth: '420px',

            maxHeight:
              'calc(100vh - 32px)',

            overflowY: 'auto',

            boxSizing: 'border-box',

            padding: '20px',

            background:
              'var(--color-bg, #ffffff)',

            color:
              'var(--color-text, #111827)',

            border:
              '1px solid var(--color-border, #e5e7eb)',

            borderRadius: '20px',

            boxShadow:
              '0 20px 60px rgba(0, 0, 0, 0.20)',

            zIndex: 9999,

            WebkitOverflowScrolling:
              'touch',
          }}
        >
          {/* ====================================================
            HANDLE
        ===================================================== */}

          <div
            style={{
              width: '40px',
              height: '4px',

              margin:
                '0 auto 16px auto',

              borderRadius: '999px',

              background:
                'var(--color-border, #d1d5db)',
            }}
          />

          {/* ====================================================
            HEADER
        ===================================================== */}

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent:
                'space-between',

              gap: '16px',

              marginBottom: '16px',
            }}
          >
            <div
              style={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.3,
                  fontWeight: 600,

                  color:
                    'var(--color-text, #111827)',
                }}
              >
                {t(
                  'shareActions.title',
                  {
                    defaultValue:
                      'Compartilhar',
                  }
                )}
              </div>

              <div
                style={{
                  marginTop: '4px',

                  fontSize: '0.8rem',
                  lineHeight: 1.4,

                  color:
                    'var(--color-text-light, #6b7280)',
                }}
              >
                {t(
                  'shareActions.subtitle',
                  {
                    defaultValue:
                      'Escolha onde você deseja compartilhar.',
                  }
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSharing}
              aria-label={t(
                'shareActions.close',
                {
                  defaultValue:
                    'Fechar',
                }
              )}
              style={{
                width: '36px',
                height: '36px',

                flexShrink: 0,

                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'center',

                border: 'none',
                borderRadius: '50%',

                background:
                  'var(--color-surface, #f3f4f6)',

                color:
                  'var(--color-text, #111827)',

                cursor:
                  isSharing
                    ? 'not-allowed'
                    : 'pointer',

                opacity:
                  isSharing ? 0.5 : 1,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line
                  x1="18"
                  y1="6"
                  x2="6"
                  y2="18"
                />

                <line
                  x1="6"
                  y1="6"
                  x2="18"
                  y2="18"
                />
              </svg>
            </button>
          </div>

          {/* ====================================================
            OPTIONS
        ===================================================== */}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {!hasAnyAsset && (
              <div
                style={{
                  padding:
                    '12px 4px',

                  fontSize:
                    '0.85rem',

                  lineHeight: 1.5,

                  color:
                    'var(--color-text-light, #6b7280)',
                }}
              >
                {t(
                  'shareActions.noAssets',
                  {
                    defaultValue:
                      'Nenhum material editorial disponível para este devocional neste idioma.',
                  }
                )}
              </div>
            )}

            {hasWhatsApp && (
              <ChannelButton
                icon="💬"
                label="WhatsApp"
                disabled={
                  isSharing
                }
                onClick={
                  onWhatsApp
                }
              />
            )}

            {hasFeed && (
              <ChannelButton
                icon="📸"
                label="Instagram Feed"
                sublabel="1080 × 1350"
                disabled={
                  isSharing
                }
                onClick={
                  onInstagramFeed
                }
              />
            )}

            {hasStory && (
              <ChannelButton
                icon="📱"
                label="Instagram Story"
                sublabel="1080 × 1920"
                disabled={
                  isSharing
                }
                onClick={
                  onInstagramStory
                }
              />
            )}

            {hasFacebook && (
              <ChannelButton
                icon="👍"
                label="Facebook"
                disabled={
                  isSharing
                }
                onClick={
                  onFacebook
                }
              />
            )}

            {hasSomethingToDownload && (
              <ChannelButton
                icon="⬇️"
                label={t(
                  'shareActions.download',
                  {
                    defaultValue:
                      'Baixar imagem',
                  }
                )}
                disabled={
                  isSharing
                }
                onClick={
                  onDownload
                }
              />
            )}
          </div>

          {/* ====================================================
            CLOSE
        ===================================================== */}

          <button
            type="button"
            onClick={onClose}
            disabled={isSharing}
            style={{
              width: '100%',

              marginTop: '12px',

              padding:
                '10px 12px',

              border: 'none',
              borderRadius: '12px',

              background:
                'transparent',

              color:
                'var(--color-text-light, #6b7280)',

              fontSize:
                '0.9rem',

              fontWeight: 500,

              cursor:
                isSharing
                  ? 'not-allowed'
                  : 'pointer',

              opacity:
                isSharing ? 0.5 : 1,
            }}
          >
            {t(
              'shareActions.close',
              {
                defaultValue:
                  'Fechar',
              }
            )}
          </button>
        </div>
      </>
    );
  };

/*
 * ============================================================
 * CHANNEL BUTTON
 * ============================================================
 */

interface ChannelButtonProps {
  icon: string;
  label: string;
  sublabel?: string;
  disabled: boolean;
  onClick: () => void;
}

const ChannelButton: React.FC<
  ChannelButtonProps
> = ({
  icon,
  label,
  sublabel,
  disabled,
  onClick,
}) => {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',

          gap: '12px',

          width: '100%',

          minWidth: 0,

          padding: '10px',

          boxSizing: 'border-box',

          background:
            'var(--color-bg, #ffffff)',

          border:
            '1px solid var(--color-border, #e5e7eb)',

          borderRadius: '12px',

          color:
            'var(--color-text, #111827)',

          cursor:
            disabled
              ? 'not-allowed'
              : 'pointer',

          textAlign: 'left',

          opacity:
            disabled ? 0.5 : 1,
        }}
      >
        {/* ICON */}
        <span
          aria-hidden="true"
          style={{
            width: '40px',
            height: '40px',

            flexShrink: 0,

            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'center',

            borderRadius: '10px',

            background:
              'var(--color-surface, #f3f4f6)',

            fontSize: '1.15rem',
          }}
        >
          {icon}
        </span>

        {/* TEXT */}
        <span
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <span
            style={{
              display: 'block',

              fontSize:
                '0.9rem',

              lineHeight: 1.3,

              fontWeight: 600,

              color:
                'var(--color-text, #111827)',

              overflowWrap:
                'break-word',
            }}
          >
            {label}
          </span>

          {sublabel && (
            <span
              style={{
                display: 'block',

                marginTop: '3px',

                fontSize:
                  '0.72rem',

                lineHeight: 1.3,

                color:
                  'var(--color-text-light, #9ca3af)',
              }}
            >
              {sublabel}
            </span>
          )}
        </span>
      </button>
    );
  };
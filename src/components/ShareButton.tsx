import React, { useState } from 'react';
import { AnalyticsService } from '../services/AnalyticsService';
import { useAuth } from '../context/AuthContext';
import type { Devotional } from '../types/Devotional';
import { useTranslation } from 'react-i18next';

interface ShareButtonProps {
  devotional: Devotional;
  asIcon?: boolean;
}

const WA_CTA: Record<string, string> = {
  'pt-BR': '📖 Leia o devocional de hoje:',
  'en':    '📖 Read today\'s devotional:',
  'es':    '📖 Lee el devocional de hoy:',
};

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

function buildWhatsAppText(
  devotional: Devotional,
  shareUrl: string,
  lang: string
): string {
  const cta = WA_CTA[lang] || WA_CTA['pt-BR'];
  const title = devotional.title?.trim() || '';
  const principle = devotional.principle_statement?.trim() || '';
  return [
    title,
    principle ? `"${principle}"` : '',
    cta,
    shareUrl,
  ]
    .filter(Boolean)
    .join('\n\n');
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
  const { t, i18n } = useTranslation('common');
  const { session } = useAuth();
  const [isSharing, setIsSharing] = useState(false);

  if (
    !devotional.id ||
    devotional.id.includes('fallback') ||
    devotional.id === 'undefined'
  ) {
    return null;
  }

  /*
   * ==========================================================
   * REFERRAL CODE
   * ==========================================================
   */

  const getReferralCode = async (): Promise<string> => {
    if (session?.user?.id) {
      try {
        const { supabase } = await import('../lib/supabase');
        const { data } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('id', session.user.id)
          .single();
        if (data?.referral_code) return data.referral_code;
      } catch { /* silently use fallback */ }
    }
    return '3MIN';
  };

  /*
   * ==========================================================
   * SHARE HANDLER
   * ==========================================================
   */

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      const lang = i18n.language;
      const referralCode = await getReferralCode();
      const shareUrl = buildShareUrl(devotional.id, referralCode, lang);
      const text = buildWhatsAppText(devotional, shareUrl, lang);

      await AnalyticsService.trackEvent('content_shared', {
        devotional_id: devotional.id,
        channel: 'whatsapp',
        has_editorial_text: true,
        has_editorial_image: false,
        referral_code: referralCode,
        language: lang,
      });

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile && navigator.share) {
        try {
          await navigator.share({ text });
          return;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') return;
          // fall through to wa.me
        }
      }

      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } catch (error) {
      console.error('WhatsApp share error:', error);
    } finally {
      setIsSharing(false);
    }
  };

  /*
   * ==========================================================
   * ICON
   * ==========================================================
   */

  const shareIcon = (
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
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );

  /*
   * ==========================================================
   * ICON VERSION
   * ==========================================================
   */

  if (asIcon) {
    return (
      <button
        type="button"
        onClick={handleShare}
        disabled={isSharing}
        className="action-btn"
        aria-label={t('shareActions.actionLabel', 'Compartilhar')}
      >
        {shareIcon}
        <span className="action-label">
          {t('shareActions.actionLabel', 'Compartilhar')}
        </span>
      </button>
    );
  }

  /*
   * ==========================================================
   * STANDARD BUTTON
   * ==========================================================
   */

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={isSharing}
      className="btn-secondary"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      {shareIcon}
      {isSharing
        ? t('shareActions.buttonLoading', 'Compartilhando...')
        : t('shareActions.button', 'Compartilhar')}
    </button>
  );
};

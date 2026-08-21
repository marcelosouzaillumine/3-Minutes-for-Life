import React, { useState } from 'react';
import { AnalyticsService } from '../services/AnalyticsService';
import { useAuth } from '../context/AuthContext';
import type { Devotional, ResolvedShareAsset } from '../types/Devotional';
import { useTranslation } from 'react-i18next';

interface ShareButtonProps {
  devotional: Devotional;
  asIcon?: boolean;
}

async function fetchAsFile(url: string, filename: string): Promise<File | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  } catch {
    return null;
  }
}

function buildShareUrl(devotionalId: string, referralCode: string, language: string): string {
  const baseUrl =
    window.location.hostname === 'localhost'
      ? window.location.origin
      : 'https://www.3minutesforlife.com';
  return `${baseUrl}/r/${referralCode}?d=${devotionalId}&lang=${language}`;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ devotional, asIcon }) => {
  const { t, i18n } = useTranslation('common');
  const { session } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  if (!devotional.id || devotional.id.includes('fallback') || devotional.id === 'undefined') {
    return null;
  }

  const shareAssets: ResolvedShareAsset | null = devotional.share_assets ?? null;
  const hasWhatsApp = !!shareAssets?.whatsapp_text?.trim();
  const hasFeed = !!shareAssets?.feed_image_url;
  const hasStory = !!shareAssets?.story_image_url;
  const hasFacebook = hasFeed; // Facebook only relies on Feed, as defined by architecture
  const hasAnyAsset = hasWhatsApp || hasFeed || hasStory;
  const whatsappImageUrl = shareAssets?.whatsapp_image_url || shareAssets?.feed_image_url || null;
  const hasDownloadableImage = !!whatsappImageUrl || hasFeed || hasStory;

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

  const trackShare = async (channel: string, referralCode: string, hasImage: boolean) => {
    await AnalyticsService.trackEvent('content_shared', {
      devotional_id: devotional.id,
      channel,
      has_editorial_text: hasWhatsApp,
      has_editorial_image: hasImage,
      referral_code: referralCode,
      language: i18n.language,
    });
  };

  const handleWhatsApp = async () => {
    if (!hasWhatsApp) return;
    setIsSharing(true);
    try {
      const referralCode = await getReferralCode();
      const shareUrl = buildShareUrl(devotional.id, referralCode, i18n.language);
      const text = shareAssets!.whatsapp_text!.replace('{{link}}', shareUrl);
      
      let imageFile: File | null = null;
      if (whatsappImageUrl) {
        imageFile = await fetchAsFile(whatsappImageUrl, 'reflexao-whatsapp.jpg');
      }
      
      await trackShare('whatsapp', referralCode, !!imageFile);
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Try Web Share with File + Text
        if (imageFile && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
          try {
            await navigator.share({ files: [imageFile], text });
            return;
          } catch (e: any) {
            if (e.name === 'AbortError') return;
            // If failed (maybe not supported exactly), fallback to text only
          }
        }
        // Fallback to text only share
        if (navigator.share) {
          try {
            await navigator.share({ text });
            return;
          } catch (e: any) {
            if (e.name === 'AbortError') return;
          }
        }
      }
      // Desktop fallback or completely unsupported
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    } catch (err) {
      console.error('WhatsApp share error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleInstagramFeed = async () => {
    if (!hasFeed) return;
    setIsSharing(true);
    try {
      const referralCode = await getReferralCode();
      await trackShare('instagram_feed', referralCode, true);
      const imageFile = await fetchAsFile(shareAssets!.feed_image_url!, 'reflexao-feed.jpg');
      if (!imageFile) { alert('Não foi possível carregar a imagem.'); return; }
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        try { await navigator.share({ files: [imageFile] }); return; }
        catch (e: any) { if (e.name === 'AbortError') return; }
      }
      const objectUrl = URL.createObjectURL(imageFile);
      const a = document.createElement('a');
      a.href = objectUrl; a.download = imageFile.name; a.click();
      URL.revokeObjectURL(objectUrl);
      alert(t('shareActions.instagramDownloadAlert', 'Imagem baixada. Publique manualmente no Instagram.'));
    } catch (err) {
      console.error('Instagram Feed error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleInstagramStory = async () => {
    if (!hasStory) return;
    setIsSharing(true);
    try {
      const referralCode = await getReferralCode();
      await trackShare('instagram_story', referralCode, true);
      const imageFile = await fetchAsFile(shareAssets!.story_image_url!, 'reflexao-story.jpg');
      if (!imageFile) { alert('Não foi possível carregar a imagem.'); return; }
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        try { await navigator.share({ files: [imageFile] }); return; }
        catch (e: any) { if (e.name === 'AbortError') return; }
      }
      const objectUrl = URL.createObjectURL(imageFile);
      const a = document.createElement('a');
      a.href = objectUrl; a.download = imageFile.name; a.click();
      URL.revokeObjectURL(objectUrl);
      alert(t('shareActions.instagramDownloadAlert', 'Imagem baixada. Publique manualmente no Instagram.'));
    } catch (err) {
      console.error('Instagram Story error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleFacebook = async () => {
    if (!hasFacebook) return;
    setIsSharing(true);
    try {
      const referralCode = await getReferralCode();
      const shareUrl = buildShareUrl(devotional.id, referralCode, i18n.language);
      await trackShare('facebook', referralCode, true);
      const fbImageUrl = shareAssets?.feed_image_url;
      const imageFile = fbImageUrl ? await fetchAsFile(fbImageUrl, 'reflexao-facebook.jpg') : null;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile && imageFile && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        try { await navigator.share({ files: [imageFile] }); return; }
        catch (e: any) { if (e.name === 'AbortError') return; }
      }
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        '_blank',
        'width=600,height=400'
      );
    } catch (err) {
      console.error('Facebook share error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = async () => {
    if (!hasDownloadableImage) return;
    setIsSharing(true);
    try {
      const referralCode = await getReferralCode();
      await trackShare('download', referralCode, true);
      const downloadUrl = whatsappImageUrl || shareAssets?.feed_image_url || shareAssets?.story_image_url;
      if (!downloadUrl) return;
      const imageFile = await fetchAsFile(downloadUrl, 'reflexao-3min.jpg');
      if (!imageFile) { alert('Não foi possível carregar a imagem.'); return; }
      const objectUrl = URL.createObjectURL(imageFile);
      const a = document.createElement('a');
      a.href = objectUrl; a.download = imageFile.name; a.click();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const panel = showPanel ? (
    <SharePanel
      hasWhatsApp={hasWhatsApp}
      hasFeed={hasFeed}
      hasStory={hasStory}
      hasFacebook={hasFacebook}
      hasAnyAsset={hasAnyAsset}
      hasSomethingToDownload={hasDownloadableImage}
      isSharing={isSharing}
      onWhatsApp={() => { setShowPanel(false); handleWhatsApp(); }}
      onInstagramFeed={() => { setShowPanel(false); handleInstagramFeed(); }}
      onInstagramStory={() => { setShowPanel(false); handleInstagramStory(); }}
      onFacebook={() => { setShowPanel(false); handleFacebook(); }}
      onDownload={() => { setShowPanel(false); handleDownload(); }}
      onClose={() => setShowPanel(false)}
      t={t}
    />
  ) : null;

  if (asIcon) {
    return (
      <div style={{ position: 'relative' }}>
        <button onClick={() => setShowPanel(prev => !prev)} disabled={isSharing} className="action-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          <span className="action-label">{t('shareActions.actionLabel')}</span>
        </button>
        {panel}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowPanel(prev => !prev)}
        disabled={isSharing}
        className="btn-secondary"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', width: '100%' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        {isSharing ? t('shareActions.buttonLoading') : t('shareActions.button')}
      </button>
      {panel}
    </div>
  );
};

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
  t: any;
}

const SharePanel: React.FC<SharePanelProps> = ({
  hasWhatsApp, hasFeed, hasStory, hasFacebook, hasAnyAsset, hasSomethingToDownload,
  isSharing, onWhatsApp, onInstagramFeed, onInstagramStory, onFacebook, onDownload, onClose, t
}) => (
  <>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
    <div style={{
      position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0,
      background: 'white', borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: '16px', zIndex: 1000, minWidth: '220px',
    }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
        Compartilhar via
      </div>
      {!hasAnyAsset && (
        <div style={{ fontSize: '0.85rem', color: '#9ca3af', padding: '8px 0' }}>
          Nenhum material editorial disponível para este devocional neste idioma.
        </div>
      )}
      {hasWhatsApp && <ChannelButton icon="💬" label="WhatsApp" disabled={isSharing} onClick={onWhatsApp} />}
      {hasFeed && <ChannelButton icon="📸" label="Instagram Feed" sublabel="1080 × 1350" disabled={isSharing} onClick={onInstagramFeed} />}
      {hasStory && <ChannelButton icon="📱" label="Instagram Story" sublabel="1080 × 1920" disabled={isSharing} onClick={onInstagramStory} />}
      {hasFacebook && <ChannelButton icon="👍" label="Facebook" disabled={isSharing} onClick={onFacebook} />}
      {hasSomethingToDownload && <ChannelButton icon="⬇️" label={t('shareActions.download', 'Baixar imagem')} disabled={isSharing} onClick={onDownload} />}
    </div>
  </>
);

interface ChannelButtonProps {
  icon: string;
  label: string;
  sublabel?: string;
  disabled: boolean;
  onClick: () => void;
}

const ChannelButton: React.FC<ChannelButtonProps> = ({ icon, label, sublabel, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      width: '100%', padding: '10px 8px',
      background: 'none', border: 'none', borderRadius: '8px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      textAlign: 'left', opacity: disabled ? 0.5 : 1,
    }}
  >
    <span style={{ fontSize: '1.2rem', width: '28px', textAlign: 'center' }}>{icon}</span>
    <span>
      <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#111827' }}>{label}</span>
      {sublabel && <span style={{ display: 'block', fontSize: '0.72rem', color: '#9ca3af' }}>{sublabel}</span>}
    </span>
  </button>
);

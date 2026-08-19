import React, { useState, useRef } from 'react';
import { AnalyticsService } from '../services/AnalyticsService';
import { useAuth } from '../context/AuthContext';
import type { Devotional } from '../types/Devotional';
import { toBlob } from 'html-to-image';
import { useTranslation } from 'react-i18next';
import { VisualCard } from './VisualCard';

interface ShareButtonProps {
  devotional: Devotional;
  asIcon?: boolean;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ devotional, asIcon }) => {
  const { t, i18n } = useTranslation('common');
  const { session } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    // P0 Bugfix: Invalid or fallback ID
    if (!devotional.id || devotional.id.includes('fallback') || devotional.id === 'undefined') {
      alert(t('shareActions.invalidId'));
      console.error('Share error: Invalid devotional ID', devotional.id);
      return;
    }

    setIsSharing(true);
    
    let referralCode = '3MIN'; // Fallback genérico para referral
    
    try {
      if (session?.user?.id) {
        const { supabase } = await import('../lib/supabase');
        const { data } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('id', session.user.id)
          .single();
          
        if (data?.referral_code) {
          referralCode = data.referral_code;
        }
      }

      await AnalyticsService.trackEvent('content_shared', { 
        devotional_id: devotional.id,
        channel: 'whatsapp'
      });

      // Obter a frase central para o Card e texto
      const quoteText = devotional.principle_statement || devotional.share_quote || devotional.title;
      
      // Construir o link e o texto editorial
      const baseUrl = window.location.hostname.includes('3minutosforlife.com')
        ? 'https://3minutosforlife.com'
        : window.location.origin;
      const shareUrl = `${baseUrl}/r/${referralCode}?d=${devotional.id}&lang=${i18n.language}`;
      
      const rawMsg = t('shareActions.message');
      const textMsg = rawMsg.replace('{{url}}', shareUrl).replace(/\\n/g, '\n');
      const text = `*${devotional.title}*\n\n${quoteText}\n\n${textMsg}`;

      let imageBlob: Blob | null = null;
      
      // Tentativa de gerar o PNG do VisualCard
      if (cardRef.current) {
        try {
          imageBlob = await toBlob(cardRef.current, {
            quality: 1.0,
            pixelRatio: 1 // Usando 1 para evitar canvas massivo/em branco
          });
        } catch (imgErr) {
          console.error("Falha ao gerar card visual", imgErr);
        }
      }

      const filesArray = imageBlob ? [
        new File([imageBlob], `reflexao.png`, {
          type: imageBlob.type,
          lastModified: new Date().getTime()
        })
      ] : undefined;

      let shared = false;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // 1. Fluxo Mobile: Tentar compartilhar via Web Share API
      // No Mobile, a bandeja do sistema sempre inclui o WhatsApp.
      if (isMobile) {
        if (filesArray && navigator.canShare && navigator.canShare({ files: filesArray })) {
          try {
            await navigator.share({
              files: filesArray,
              title: t('shareActions.title'),
              text: text
            });
            shared = true;
          } catch (e: any) {
            if (e.name === 'AbortError') return; // Usuário cancelou intencionalmente
            console.error('Erro no share com arquivo:', e);
          }
        }

        // Fallback Mobile para texto apenas
        if (!shared && navigator.share) {
          try {
            await navigator.share({
              title: t('shareActions.title'),
              text: text
            });
            shared = true;
          } catch (e: any) {
            if (e.name === 'AbortError') return; // Usuário cancelou intencionalmente
            console.error('Erro no share com texto:', e);
          }
        }
      }

      // 2. Fluxo Desktop (ou fallback caso Mobile falhe): WhatsApp Web
      // No Desktop (Mac/Windows), a bandeja nativa frequentemente não possui o WhatsApp.
      // O botão se propõe a "Compartilhar no WhatsApp", então vamos direto para ele.
      if (!shared) {
        if (!isMobile && imageBlob && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                [imageBlob.type]: imageBlob
              })
            ]);
            alert(t('shareActions.desktopAlert'));
          } catch (err) {
            console.warn('Não foi possível copiar a imagem no Desktop:', err);
          }
        }

        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        const win = window.open(whatsappUrl, '_blank');
        if (win) shared = true;
      }

      // 4. Último Fallback: Copiar para área de transferência
      if (!shared) {
        try {
          await navigator.clipboard.writeText(text);
          alert(t('shareActions.copied'));
          shared = true;
        } catch (e) {
          alert(t('shareActions.copyError').replace('{{url}}', shareUrl));
        }
      }

      if (shared) {
        // Apenas registrar link gerado se chegou até aqui
        await AnalyticsService.trackEvent('referral_link_generated', {
          devotional_id: devotional.id,
          referral_code: referralCode
        });
      }

    } catch (err) {
      console.error('Error sharing:', err);
    } finally {
      setIsSharing(false);
    }
  };

  // Obter a frase central
  const quote = devotional.principle_statement || devotional.share_quote || devotional.title;

  return (
    <>
      <VisualCard ref={cardRef} title={devotional.title} quote={quote} />
      
      {asIcon ? (
        <button 
          onClick={handleShare} 
          disabled={isSharing}
          className="action-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          <span className="action-label">{t('shareActions.actionLabel')}</span>
        </button>
      ) : (
        <button 
          onClick={handleShare} 
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
      )}
    </>
  );
};

import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { logoBase64 } from '../constants/logoBase64';

interface VisualCardProps {
  title: string;
  quote: string;
}

export const VisualCard = forwardRef<HTMLDivElement, VisualCardProps>(
  ({ title, quote }, ref) => {
    const { t } = useTranslation('common');
    return (
      <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -9999 }}>
        <div
          ref={ref}
          style={{
            width: '1080px',
            height: '1350px',
            backgroundColor: '#FAFAFA', 
            color: '#1a1a1a',
            padding: '140px 120px',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
            boxSizing: 'border-box'
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '80px', flexShrink: 0 }}>
            <span
              style={{
                fontSize: '28px',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#666666',
                fontWeight: 600
              }}
            >
              {t('visualCard.header', { defaultValue: '3 Minutos para a Vida' })}
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: '"Georgia", serif',
              fontSize: '84px',
              lineHeight: 1.15,
              fontWeight: 400,
              marginBottom: '80px',
              maxWidth: '900px',
              color: '#000000',
              letterSpacing: '-0.02em',
              flexShrink: 0,
              margin: '0 0 80px 0' // Explicit margin to avoid default h1 margin bugs
            }}
          >
            {title}
          </h1>

          {/* Divider */}
          <div
            style={{
              width: '140px',
              height: '4px',
              backgroundColor: '#1a1a1a',
              marginBottom: '80px',
              flexShrink: 0
            }}
          />

          {/* Quote */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start' }}>
            <p
              style={{
                fontSize: '52px',
                fontWeight: 400,
                lineHeight: 1.4,
                color: '#333333',
                maxWidth: '850px',
                fontStyle: 'italic',
                margin: 0
              }}
            >
              "{quote}"
            </p>
          </div>

          {/* Footer Branding */}
          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%'
            }}
          >
            <div 
              style={{ 
                height: '187px', 
                width: '520px', 
                backgroundImage: `url(${logoBase64})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'left center'
              }} 
            />
            
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '5px',
                textAlign: 'right'
              }}
            >
              <span style={{ fontSize: '24px', fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em', marginBottom: '2px' }}>
                {t('visualCard.footer', { defaultValue: 'Pare. Reflita. Pratique.' })}
              </span>
              <span style={{ fontSize: '20px', color: '#666666', fontWeight: 500 }}>
                3minutesforlife.com
              </span>
              <span style={{ fontSize: '20px', color: '#666666', fontWeight: 500 }}>
                @3minutesforlife
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

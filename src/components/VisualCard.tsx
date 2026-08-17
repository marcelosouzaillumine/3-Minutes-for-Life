import { forwardRef } from 'react';

interface VisualCardProps {
  title: string;
  quote: string;
}

export const VisualCard = forwardRef<HTMLDivElement, VisualCardProps>(
  ({ title, quote }, ref) => {
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
          <div style={{ marginBottom: '80px' }}>
            <span
              style={{
                fontSize: '28px',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#666666',
                fontWeight: 600
              }}
            >
              3 Minutos para a Vida
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
              letterSpacing: '-0.02em'
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
              marginBottom: '80px'
            }}
          />

          {/* Quote */}
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: '52px',
                fontWeight: 400,
                lineHeight: 1.4,
                color: '#333333',
                maxWidth: '850px',
                fontStyle: 'italic'
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
              gap: '24px'
            }}
          >
            {/* Simple Logo Circle Mock */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '32px',
                backgroundColor: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '28px' }}>3</span>
            </div>
            <span
              style={{
                fontSize: '32px',
                fontWeight: 600,
                letterSpacing: '-0.03em',
                color: '#1a1a1a'
              }}
            >
              3 minutos para a vida
            </span>
          </div>
        </div>
      </div>
    );
  }
);

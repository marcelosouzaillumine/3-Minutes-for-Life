import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from 'i18next';
import { AnalyticsService } from '../services/AnalyticsService';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Última linha de defesa: sem isso, um erro de render em qualquer tela
// (inclusive a Landing, que todo visitante vê) deixa a tela em branco sem
// recuperação. Reporta via o mesmo canal de analytics já existente
// (POST /analytics/events no gateway), sem depender de um serviço novo.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
    AnalyticsService.trackEvent('client_error', {
      message: error.message,
      stack: error.stack?.slice(0, 2000),
      componentStack: info.componentStack?.slice(0, 2000),
      url: window.location.pathname,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
          {i18n.t('common:errorBoundary.title')}
        </h1>
        <p style={{ color: 'var(--color-text-light, #666)', maxWidth: '360px', margin: 0 }}>
          {i18n.t('common:errorBoundary.description')}
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            marginTop: '0.5rem',
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--color-accent, #b8860b)',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {i18n.t('common:errorBoundary.reload')}
        </button>
      </div>
    );
  }
}

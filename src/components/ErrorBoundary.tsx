import { Component, type ErrorInfo, type ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import i18n from 'i18next';
import { AnalyticsService } from '../services/AnalyticsService';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Deploy novo apaga os chunks com hash do anterior: quem está com a aba
// aberta pede um arquivo que não existe mais e o servidor devolve HTML.
const CHUNK_ERROR = /dynamically imported module|module script|Importing a module script failed/i;
const RELOAD_KEY = 'chunk-reload-at';

// Recarrega uma única vez (janela de 30s) para pegar o index novo; se o erro
// persistir depois disso, cai na tela de erro normal em vez de entrar em loop.
function reloadOnStaleChunk(error: Error): boolean {
  if (!CHUNK_ERROR.test(error.message)) return false;
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
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
    if (reloadOnStaleChunk(error)) return;
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
    // O canal de analytics acima depende do próprio backend do 3ML estar de
    // pé para chegar a algum lugar (e engole silenciosamente qualquer falha
    // de rede — achado da auditoria 360°). Sentry.captureException não tem
    // essa dependência circular; é um no-op seguro sem VITE_SENTRY_DSN.
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
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

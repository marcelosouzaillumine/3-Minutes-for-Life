import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CommunicationInboxService,
  type InAppCommunicationMessage,
} from '../services/CommunicationInboxService';
import { CommunicationMessageView } from './CommunicationMessageView';

function htmlToPreviewText(html: string, maxLength = 110): string {
  if (!html) return '';

  const container = document.createElement('div');
  container.innerHTML = html;
  container.querySelectorAll('[data-type="cta"]').forEach(el => el.remove());

  const text = (container.textContent || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function CommunicationInbox() {
  const { t } = useTranslation();

  const [messages, setMessages] = useState<InAppCommunicationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMessage, setSelectedMessage] =
    useState<InAppCommunicationMessage | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await CommunicationInboxService.getMessages();
        if (active) setMessages(data);
      } catch (err) {
        console.error(
          'Failed to load communication inbox:',
          err
        );

        if (active) {
          setError(
            t(
              'profile:communication.loadError',
              'Não foi possível carregar suas mensagens.'
            )
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [t]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const handleOpenMessage = async (message: InAppCommunicationMessage) => {
    setSelectedMessage(message);
    if (message.opened_at) return;

    const openedAt = new Date().toISOString();
    setMessages(current =>
      current.map(m =>
        m.id === message.id ? { ...m, status: 'opened', opened_at: openedAt } : m
      )
    );
    setSelectedMessage(current =>
      current && current.id === message.id
        ? { ...current, status: 'opened', opened_at: openedAt }
        : current
    );

    try {
      await CommunicationInboxService.markAsOpened([message.id]);
    } catch (err) {
      console.error('Failed to mark communication as opened:', err);
    }
  };

  if (selectedMessage) {
    return (
      <CommunicationMessageView
        message={selectedMessage}
        onBack={() => setSelectedMessage(null)}
      />
    );
  }

  if (loading) {
    return (
      <p className="communication-inbox-loading">
        {t(
          'profile:communication.loading',
          'Carregando mensagens...'
        )}
      </p>
    );
  }

  if (error) {
    return (
      <p className="communication-inbox-error">
        {error}
      </p>
    );
  }

  if (messages.length === 0) {
    return (
      <p className="communication-inbox-empty">
        {t(
          'profile:communication.empty',
          'Você não tem novas mensagens.'
        )}
      </p>
    );
  }

  const unreadCount = messages.filter(m => !m.opened_at).length;

  return (
    <>
      {unreadCount > 0 && (
        <div className="communication-inbox-summary">
          <span className="communication-inbox-summary-dot" aria-hidden="true" />
          {unreadCount === 1
            ? t('profile:communication.unreadOne', '1 mensagem não lida')
            : t('profile:communication.unreadMany', { defaultValue: '{{count}} mensagens não lidas', count: unreadCount })}
        </div>
      )}
      <div className="communication-inbox-list">
        {messages.map(message => {
          const unread = !message.opened_at;
          return (
            <button
              key={message.id}
              type="button"
              onClick={() => handleOpenMessage(message)}
              className={`communication-inbox-row ${
                unread ? 'communication-inbox-row-unread' : ''
              }`}
            >
              <div className="communication-inbox-row-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {unread && <span className="communication-inbox-row-badge" aria-hidden="true" />}
              </div>

              <div className="communication-inbox-row-body">
                <div className="communication-inbox-row-top">
                  <h3 className="communication-inbox-row-title">
                    {message.title || t('profile:communication.untitled', 'Mensagem sem título')}
                  </h3>
                  <div className="communication-inbox-row-meta">
                    {unread && (
                      <span className="communication-inbox-row-new-pill">
                        {t('profile:communication.new', 'Nova')}
                      </span>
                    )}
                    <span className="communication-inbox-row-date">{formatDate(message.created_at)}</span>
                  </div>
                </div>
                <p className="communication-inbox-row-preview">
                  {htmlToPreviewText(message.body) || t('profile:communication.noPreview', 'Toque para abrir')}
                </p>
              </div>

              <svg
                className="chevron-icon communication-inbox-row-chevron"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                width="18"
                height="18"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          );
        })}
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CommunicationInboxService,
  type InAppCommunicationMessage,
} from '../services/CommunicationInboxService';

export function CommunicationInbox() {
  const { t } = useTranslation();

  const [messages, setMessages] = useState<InAppCommunicationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await CommunicationInboxService.getMessages();

        if (!active) return;

        setMessages(data);

        const unreadIds = data
          .filter(message => !message.opened_at)
          .map(message => message.id);

        if (unreadIds.length > 0) {
          try {
            await CommunicationInboxService.markAsOpened(unreadIds);

            if (active) {
              setMessages(current =>
                current.map(message =>
                  unreadIds.includes(message.id)
                    ? {
                        ...message,
                        status: 'opened',
                        opened_at: new Date().toISOString(),
                      }
                    : message
                )
              );
            }
          } catch (err) {
            console.error(
              'Failed to mark communications as opened:',
              err
            );
          }
        }
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
        if (active) {
          setLoading(false);
        }
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

  async function handleClick(
    message: InAppCommunicationMessage
  ) {
    if (!message.cta_url) return;

    try {
      await CommunicationInboxService.markAsClicked(message.id);
    } catch (err) {
      console.error(
        'Failed to register communication click:',
        err
      );
    }

    window.location.href = message.cta_url;
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

  return (
    <div className="communication-inbox">
      {messages.map(message => (
        <article
          key={message.id}
          className={`communication-inbox-message ${
            !message.opened_at
              ? 'communication-inbox-message-unread'
              : ''
          }`}
        >
          <div className="communication-inbox-meta">
            {formatDate(message.created_at)}
          </div>

          <h3>{message.title}</h3>

          <p>{message.body}</p>

          {message.cta_label && message.cta_url && (
            <button
              type="button"
              onClick={() => handleClick(message)}
              className="communication-inbox-cta"
            >
              {message.cta_label}
            </button>
          )}
        </article>
      ))}
    </div>
  );
}

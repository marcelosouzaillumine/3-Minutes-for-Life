import { useTranslation } from 'react-i18next';
import { HtmlRenderer } from './HtmlRenderer';
import type { InAppCommunicationMessage } from '../services/CommunicationInboxService';

interface CommunicationMessageViewProps {
  message: InAppCommunicationMessage;
  onBack: () => void;
}

export function CommunicationMessageView({
  message,
  onBack,
}: CommunicationMessageViewProps) {
  const { t } = useTranslation();

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="communication-message-view">
      <button
        type="button"
        onClick={onBack}
        className="communication-message-view-back"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t('profile:communication.back', 'Voltar')}
      </button>

      <div className="communication-message-view-card">
        <span className="communication-message-view-date">
          {formatDate(message.created_at)}
        </span>
        <h3 className="communication-message-view-title">{message.title}</h3>

        <HtmlRenderer html={message.body} className="communication-message-view-body" />
      </div>
    </div>
  );
}

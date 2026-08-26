import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConversationService } from '../services/ConversationService';
import { CommunicationInboxService } from '../services/CommunicationInboxService';
import { useAuth } from '../context/AuthContext';

interface MessageNoticeProps {
  onOpen: () => void;
}

/**
 * Aviso de resposta recebida, no topo da área logada.
 *
 * Só aparece quando há resposta não lida. A conversa em si mora no
 * Perfil — aqui é só a chamada, porque o Perfil é visitado com pouca
 * frequência e a resposta se perderia lá.
 */
export function MessageNotice({ onOpen }: MessageNoticeProps) {
  const { t } = useTranslation(['profile']);
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    let active = true;
    Promise.all([
      ConversationService.getUnreadCount(),
      CommunicationInboxService.getUnreadCount(),
    ]).then(([replyCount, communicationCount]) => {
      if (active) setCount(replyCount + communicationCount);
    });

    return () => { active = false; };
  }, [user]);

  if (!user || count === 0) return null;

  return (
    <button
      type="button"
      className="reply-notice"
      onClick={onOpen}
    >
      <span className="reply-notice-dot" aria-hidden="true" />
      <span className="reply-notice-text">
        {count === 1
          ? t('profile:messages.noticeSingle', 'Você recebeu uma nova mensagem.')
          : t('profile:messages.noticeMany', {
              count,
              defaultValue: `Você tem ${count} novas mensagens.`,
            })}
      </span>
      <span className="reply-notice-action">
        {t('profile:messages.noticeAction', 'Ver')}
      </span>
    </button>
  );
}

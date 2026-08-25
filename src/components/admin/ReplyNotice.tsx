import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConversationService } from '../services/ConversationService';
import { useAuth } from '../context/AuthContext';

interface ReplyNoticeProps {
  onOpen: () => void;
}

/**
 * Aviso de resposta recebida, no topo da área logada.
 *
 * Só aparece quando há resposta não lida. A conversa em si mora no
 * Perfil — aqui é só a chamada, porque o Perfil é visitado com pouca
 * frequência e a resposta se perderia lá.
 */
export function ReplyNotice({ onOpen }: ReplyNoticeProps) {
  const { t } = useTranslation(['profile']);
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    let active = true;
    ConversationService.getUnreadCount().then(n => {
      if (active) setCount(n);
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
          ? t('profile:conversations.noticeSingle', 'Você recebeu uma resposta.')
          : t('profile:conversations.noticeMany', { count, defaultValue: `Você recebeu ${count} respostas.` })}
      </span>
      <span className="reply-notice-action">
        {t('profile:conversations.noticeAction', 'Ver')}
      </span>
    </button>
  );
}

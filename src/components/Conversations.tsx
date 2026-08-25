import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConversationService, type Conversation } from '../services/ConversationService';

/**
 * Conversas: o que a pessoa escreveu e a resposta que recebeu.
 *
 * Mostra as duas mensagens juntas porque a resposta pode chegar
 * semanas depois — sem o texto original, ela chega sem contexto.
 *
 * Marca como lidas ao abrir, não ao rolar: quem chega aqui veio pelo
 * aviso, com intenção de ler.
 */
export function Conversations() {
  const { t } = useTranslation(['profile']);

  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    ConversationService.getConversations()
      .then(async (data) => {
        if (!active) return;
        setItems(data);

        const unread = data.filter(c => !c.read_at).map(c => c.id);
        if (unread.length > 0) {
          try {
            await ConversationService.markAsRead(unread);
          } catch {
            // Falhar ao marcar não impede a leitura — o conteúdo já
            // está na tela. Fica para a próxima visita.
          }
        }
      })
      .catch(err => {
        console.error('Failed to load conversations:', err);
        if (active) setError(t('profile:conversations.loadError', 'Não foi possível carregar suas mensagens.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const formatDate = (iso: string | null) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return <p className="conversations-loading">{t('profile:conversations.loading', 'Carregando...')}</p>;
  }

  if (error) {
    return <p className="conversations-error">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <p className="conversations-empty">
        {t('profile:conversations.empty', 'Quando você enviar um pedido de oração ou testemunho, as respostas aparecem aqui.')}
      </p>
    );
  }

  return (
    <div className="conversations">
      {items.map(item => (
        <article key={item.id} className="conversation">
          {item.original_message && (
            <div className="conversation-original">
              <span className="conversation-meta">
                {item.relationship_type === 'prayer_request'
                  ? t('profile:conversations.yourRequest', 'Seu pedido')
                  : t('profile:conversations.yourTestimony', 'Seu testemunho')}
                {item.original_sent_at && ` · ${formatDate(item.original_sent_at)}`}
              </span>
              <p>{item.original_message}</p>
            </div>
          )}

          <div className="conversation-reply">
            <span className="conversation-meta">
              {t('profile:conversations.reply', 'Resposta')} · {formatDate(item.sent_at)}
            </span>
            <p>{item.message}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

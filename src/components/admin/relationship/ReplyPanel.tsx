import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminRelationshipService, buildReplyLink } from '../../../services/AdminRelationshipService';
import type { RelationshipContact, RelationshipReply } from '../../../types/Relationship';

interface ReplyPanelProps {
  relationshipType: 'testimonial' | 'prayer_request';
  relationshipId: string;
  onReplied: () => void;
}

/**
 * Painel de resposta individual.
 *
 * O envio acontece FORA do sistema: o botão abre o WhatsApp ou o
 * cliente de e-mail do admin com o texto já preenchido. Aqui só
 * registramos que a resposta foi enviada — por isso o texto do botão
 * é "abrir e registrar", não "enviar". Prometer envio seria mentir
 * sobre o que o clique faz.
 */
export function ReplyPanel({ relationshipType, relationshipId, onReplied }: ReplyPanelProps) {
  const { t } = useTranslation(['common']);

  const [contact, setContact] = useState<RelationshipContact | null>(null);
  const [replies, setReplies] = useState<RelationshipReply[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      AdminRelationshipService.getContact(relationshipType, relationshipId),
      AdminRelationshipService.getReplies(relationshipType, relationshipId),
    ])
      .then(([c, r]) => {
        if (!active) return;
        setContact(c);
        setReplies(r);
      })
      .catch(err => {
        console.error('Failed to load reply panel data:', err);
        if (active) setError(t('admin.relationship.reply.loadError', 'Não foi possível carregar os dados de contato.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [relationshipType, relationshipId]);

  const handleSend = async (channel: 'whatsapp' | 'email' | 'in_app') => {
    if (!contact) return;

    if (!message.trim()) {
      setValidationError(t('admin.relationship.reply.emptyMessage', 'Escreva uma mensagem antes de enviar.'));
      return;
    }
    setValidationError('');

    // in_app não sai do sistema: a resposta aparece na área logada da
    // pessoa. Só os canais externos precisam de link e de contato.
    let link: string | null = null;
    if (channel !== 'in_app') {
      link = buildReplyLink(channel, contact, message);
      if (!link) {
        setValidationError(
          channel === 'whatsapp'
            ? t('admin.relationship.reply.noPhone', 'Esta pessoa não cadastrou telefone.')
            : t('admin.relationship.reply.noEmail', 'Esta pessoa não tem e-mail cadastrado.')
        );
        return;
      }
    }

    setSending(true);
    setError('');

    try {
      // Registra primeiro. Se falhar, não abrimos o canal — evita
      // resposta enviada sem histórico.
      await AdminRelationshipService.recordReply({
        relationshipType,
        relationshipId,
        channel,
        message,
      });

      if (link) window.open(link, '_blank', 'noopener,noreferrer');

      const updated = await AdminRelationshipService.getReplies(relationshipType, relationshipId);
      setReplies(updated);
      setMessage('');
      onReplied();
    } catch (err) {
      console.error('Failed to record reply:', err);
      setError(t('admin.relationship.reply.saveError', 'Não foi possível registrar a resposta.'));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <p className="reply-panel-loading">{t('admin.relationship.reply.loading', 'Carregando contato...')}</p>;
  }

  if (error && !contact) {
    return <p className="reply-panel-error">{error}</p>;
  }

  const hasPhone = Boolean(contact?.phone);
  const hasEmail = Boolean(contact?.email);

  return (
    <div className="reply-panel">
      <h4 className="reply-panel-title">
        {t('admin.relationship.reply.title', 'Responder')}
      </h4>

      <div className="reply-panel-contact">
        {hasPhone && <span>{contact?.phone}</span>}
        {hasEmail && <span>{contact?.email}</span>}
        {!hasPhone && !hasEmail && (
          <span className="reply-panel-warn">
            {t('admin.relationship.reply.noContact', 'Sem dados de contato cadastrados.')}
          </span>
        )}
      </div>

      {replies.length > 0 && (
        <div className="reply-panel-history">
          <span className="reply-panel-history-label">
            {t('admin.relationship.reply.history', 'Respostas anteriores')}
          </span>
          {replies.map(r => (
            <div key={r.id} className="reply-panel-history-item">
              <span className="reply-panel-history-meta">
                {new Date(r.sent_at).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
                {' · '}
                {r.channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
              </span>
              <p>{r.message}</p>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          if (validationError) setValidationError('');
        }}
        placeholder={t('admin.relationship.reply.placeholder', 'Escreva sua resposta...')}
        className="reply-panel-input"
        rows={4}
      />

      {validationError && <p className="reply-panel-error">{validationError}</p>}
      {error && <p className="reply-panel-error">{error}</p>}

      <div className="reply-panel-actions">
        {/* Canal principal: a resposta aparece na área logada da
            pessoa. Não depende de telefone nem expõe o contato de
            quem responde. */}
        <button
          type="button"
          disabled={sending}
          onClick={() => handleSend('in_app')}
          className="reply-panel-btn reply-panel-btn--primary"
        >
          {sending
            ? t('admin.relationship.reply.sending', 'Enviando...')
            : t('admin.relationship.reply.sendInApp', 'Responder no app')}
        </button>
      </div>

      <details className="reply-panel-external">
        <summary>
          {t('admin.relationship.reply.externalToggle', 'Responder por outro canal')}
        </summary>

        <div className="reply-panel-actions">
          <button
            type="button"
            disabled={sending || !hasPhone}
            onClick={() => handleSend('whatsapp')}
            className="reply-panel-btn"
          >
            {t('admin.relationship.reply.openWhatsapp', 'Abrir no WhatsApp e registrar')}
          </button>

          <button
            type="button"
            disabled={sending || !hasEmail}
            onClick={() => handleSend('email')}
            className="reply-panel-btn"
          >
            {t('admin.relationship.reply.openEmail', 'Abrir no e-mail e registrar')}
          </button>
        </div>

        <p className="reply-panel-note">
          {t(
            'admin.relationship.reply.externalNote',
            'Nestes casos o envio acontece no seu WhatsApp ou cliente de e-mail — aqui só fica o registro. Seu número pessoal fica visível para a pessoa.'
          )}
        </p>
      </details>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

type Channel = 'email' | 'whatsapp';
type Purpose = 'devotional_updates' | 'project_support' | 'relationship_reply';

interface ConsentRow {
  channel: Channel;
  purpose: Purpose;
  granted: boolean;
  occurred_at: string;
}

/**
 * Preferências de comunicação.
 *
 * A pessoa controla por finalidade, não em bloco: pode querer resposta
 * ao pedido de oração e não querer campanha. Consentimento genérico
 * não serve — precisa ser granular para ser válido.
 *
 * Cada alteração grava um evento novo (a tabela é append-only), então
 * o histórico de quando cada escolha foi feita fica preservado.
 */
export function CommunicationPreferences() {
  const { t } = useTranslation(['profile']);

  const [consents, setConsents] = useState<ConsentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc('get_my_communication_consents');
      if (rpcError) throw rpcError;
      setConsents((data || []) as ConsentRow[]);
    } catch (err) {
      console.error('Failed to load consents:', err);
      setError(t('profile:consent.loadError', 'Não foi possível carregar suas preferências.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const isGranted = (purpose: Purpose, channel: Channel): boolean => {
    const row = consents.find(c => c.purpose === purpose && c.channel === channel);
    // Ausência de registro é tratada como não concedido — nunca o contrário.
    return row?.granted ?? false;
  };

  const toggle = async (purpose: Purpose, channel: Channel, next: boolean) => {
    const key = `${purpose}:${channel}`;
    setSaving(key);
    setError('');

    // Atualização otimista, revertida se a gravação falhar.
    const previous = consents;
    setConsents(prev => {
      const rest = prev.filter(c => !(c.purpose === purpose && c.channel === channel));
      return [...rest, { purpose, channel, granted: next, occurred_at: new Date().toISOString() }];
    });

    try {
      const { error: rpcError } = await supabase.rpc('set_communication_consent', {
        p_channel: channel,
        p_purpose: purpose,
        p_granted: next,
        p_source: 'profile',
      });
      if (rpcError) throw rpcError;
    } catch (err) {
      console.error('Failed to save consent:', err);
      setConsents(previous);
      setError(t('profile:consent.saveError', 'Não foi possível salvar. Tente novamente.'));
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="consent-section">
        <p className="consent-loading">{t('profile:consent.loading', 'Carregando...')}</p>
      </div>
    );
  }

  const groups: Array<{ purpose: Purpose; title: string; desc: string; locked?: boolean }> = [
    {
      purpose: 'relationship_reply',
      title: t('profile:consent.replyTitle', 'Resposta às minhas mensagens'),
      desc: t('profile:consent.replyDesc', 'Quando você envia um pedido de oração ou testemunho, podemos responder.'),
    },
    {
      purpose: 'devotional_updates',
      title: t('profile:consent.updatesTitle', 'Novidades'),
      desc: t('profile:consent.updatesDesc', 'Avisos quando uma nova reflexão é publicada.'),
    },
    {
      purpose: 'project_support',
      title: t('profile:consent.supportTitle', 'Apoio ao projeto'),
      desc: t('profile:consent.supportDesc', 'Convites ocasionais para ajudar a manter o projeto.'),
    },
  ];

  return (
    <div className="consent-section">
      <h3 className="consent-heading">
        {t('profile:consent.title', 'Preferências de comunicação')}
      </h3>

      {error && <p className="consent-error">{error}</p>}

      {groups.map(group => (
        <div key={group.purpose} className="consent-group">
          <div className="consent-group-text">
            <strong>{group.title}</strong>
            <span>{group.desc}</span>
          </div>

          <div className="consent-toggles">
            {(['email', 'whatsapp'] as Channel[]).map(channel => {
              const key = `${group.purpose}:${channel}`;
              return (
                <label key={channel} className="consent-toggle">
                  <input
                    type="checkbox"
                    checked={isGranted(group.purpose, channel)}
                    disabled={saving === key}
                    onChange={(e) => toggle(group.purpose, channel, e.target.checked)}
                  />
                  <span>
                    {channel === 'email'
                      ? t('profile:consent.email', 'E-mail')
                      : t('profile:consent.whatsapp', 'WhatsApp')}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <p className="consent-note">
        {t('profile:consent.note', 'Você pode alterar essas escolhas a qualquer momento.')}
      </p>
    </div>
  );
}

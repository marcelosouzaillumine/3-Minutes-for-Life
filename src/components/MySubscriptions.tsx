import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MissionService } from '../services/MissionService';
import type { RecurringSubscription } from '../services/MissionService';

export function MySubscriptions() {
  const { t, i18n } = useTranslation(['profile', 'common']);
  const [subscriptions, setSubscriptions] = useState<RecurringSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await MissionService.getMySubscriptions();
      setSubscriptions(data);
    } catch (err) {
      console.error(err);
      setError(t('profile:subscriptions.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleCancel = async (subscriptionId: string, provider: 'asaas' | 'stripe') => {
    if (!window.confirm(t('profile:subscriptions.cancelConfirm'))) return;
    setCancellingId(subscriptionId);
    setFeedback('');
    try {
      await MissionService.cancelSubscription(subscriptionId, provider);
      setFeedback(t('profile:subscriptions.cancelSuccess'));
      await fetchSubscriptions();
    } catch (err) {
      console.error(err);
      setFeedback(t('profile:subscriptions.cancelError'));
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--color-text-light)' }}>
        {t('profile:subscriptions.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--color-text-light)' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      {feedback && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.85rem 1rem',
          borderRadius: '10px',
          backgroundColor: '#f9f9f9',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text)',
          fontSize: '0.9rem',
        }}>
          {feedback}
        </div>
      )}

      {subscriptions.length === 0 ? (
        <div style={{
          padding: '3rem 2rem',
          backgroundColor: '#f9f9f9',
          borderRadius: '16px',
          textAlign: 'center',
          border: '1px dashed var(--color-border)'
        }}>
          <p style={{ color: 'var(--color-text-light)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
            {t('profile:subscriptions.empty')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {subscriptions.map(s => {
            const amount = (s.amountCents / 100).toLocaleString(i18n.language || 'pt-BR', {
              style: 'currency',
              currency: s.currency || 'BRL',
            });
            const cycleLabel = (s.cycle === 'YEARLY' || s.cycle === 'year')
              ? t('profile:subscriptions.yearly')
              : t('profile:subscriptions.monthly');
            const isCancelling = cancellingId === s.subscriptionId;
            return (
              <div key={s.subscriptionId} style={{
                padding: '1.5rem',
                backgroundColor: 'var(--color-bg)',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)' }}>
                    {amount} · {cycleLabel}
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: '1rem' }}>
                  {t('profile:subscriptions.since', {
                    date: new Date(s.createdAt).toLocaleDateString(i18n.language || 'pt-BR'),
                  })}
                </div>
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => handleCancel(s.subscriptionId, s.provider)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: 'var(--color-text)',
                    cursor: isCancelling ? 'not-allowed' : 'pointer',
                    opacity: isCancelling ? 0.6 : 1,
                  }}
                >
                  {isCancelling ? t('profile:subscriptions.cancelling') : t('profile:subscriptions.cancelBtn')}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

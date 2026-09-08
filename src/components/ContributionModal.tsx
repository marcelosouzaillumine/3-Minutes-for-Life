import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../pages/Mission.css';
import { MissionService } from '../services/MissionService';
import { useAuth } from '../context/AuthContext';

export type ContributionTier = 'apoio' | 'livre';
export type Periodicity = 'mensal' | 'anual' | 'unica';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTier?: ContributionTier;
  initialPeriodicity?: Periodicity;
}

// Mapeamento para os tipos aceitos pela API
const frequencyMap: Record<string, 'one_time' | 'monthly' | 'yearly'> = {
  apoio_mensal: 'monthly',
  apoio_anual: 'yearly',
  livre_unica: 'one_time',
  livre_mensal: 'monthly',
};

const defaultAmountMap: Record<string, string> = {
  apoio_mensal: '9.90',
  apoio_anual: '59.90',
  livre_unica: '20.00',
  livre_mensal: '20.00',
};

function onlyDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

export function ContributionModal({ isOpen, onClose, initialTier = 'apoio', initialPeriodicity = 'mensal' }: ContributionModalProps) {
  const { t } = useTranslation('contribution');
  const { user } = useAuth();
  const [tier, setTier] = useState<ContributionTier>(initialTier);
  const [periodicity, setPeriodicity] = useState<Periodicity>(initialPeriodicity);
  const [customValue, setCustomValue] = useState<string>('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const planKey = `${tier}_${periodicity}`;
  const frequency = frequencyMap[planKey] ?? 'one_time';
  const isFixedAmount = tier === 'apoio';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const rawAmount = isFixedAmount ? defaultAmountMap[planKey] : customValue;
    const amountCents = Math.round(Number((rawAmount || '').replace(',', '.')) * 100);
    const minCents = frequency === 'yearly' ? 5000 : 500;
    const minText = frequency === 'yearly' ? 'R$ 50,00' : 'R$ 5,00';

    if (!Number.isFinite(amountCents) || amountCents < minCents) {
      setFormError(t('oneTime.errorMinAmount', `O valor mínimo é ${minText}.`));
      return;
    }

    const cleanCpfCnpj = onlyDigits(cpfCnpj);
    if (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14) {
      setFormError(t('oneTime.errorCpf', 'Informe um CPF ou CNPJ válido.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const { checkoutUrl } = await MissionService.createCheckout(
        amountCents,
        cleanCpfCnpj,
        frequency,
        paymentMethod
      );
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setFormError(err.message || t('oneTime.errorGeneric', 'Não foi possível criar o checkout. Tente novamente.'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <h2 className="modal-title">{t('modal.title')}</h2>
        <p className="modal-desc">
          {t('modal.desc')}
        </p>

        {!user ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <p style={{ fontSize: '0.95rem', color: '#555', marginBottom: '1.25rem' }}>
              {t('oneTime.needsLogin', 'Entre ou crie sua conta para vincular seu apoio ao seu perfil.')}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <a className="btn-primary" href="/login?redirectTo=/apoiar">
                {t('oneTime.login', 'Entrar ou criar conta')}
              </a>
            </div>
          </div>
        ) : (
          <form className="modal-form" onSubmit={handleSubmit}>
            
            <div className="form-group">
              <label>{t('modal.typeLabel')}</label>
              <select value={tier} onChange={e => {
                const newTier = e.target.value as ContributionTier;
                setTier(newTier);
                if (newTier === 'apoio' && periodicity === 'unica') setPeriodicity('mensal');
                if (newTier === 'livre' && periodicity === 'anual') setPeriodicity('mensal');
              }}>
                <option value="apoio">{t('modal.options.apoio')}</option>
                <option value="livre">{t('modal.options.livre')}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t('modal.periodicityLabel')}</label>
              <select value={periodicity} onChange={e => setPeriodicity(e.target.value as Periodicity)}>
                {tier === 'apoio' && (
                  <>
                    <option value="mensal">{t('modal.options.mensal')}</option>
                    <option value="anual">{t('modal.options.anual')}</option>
                  </>
                )}
                {tier === 'livre' && (
                  <>
                    <option value="unica">{t('modal.options.unicaLivre')}</option>
                    <option value="mensal">{t('modal.options.mensalLivre')}</option>
                  </>
                )}
              </select>
            </div>

            {/* Seletor de meio de pagamento */}
            <div className="form-group">
              <label>{t('modal.paymentMethodLabel', 'Forma de pagamento')}</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  style={{
                    flex: 1, padding: '0.6rem', borderRadius: '8px',
                    border: `2px solid ${paymentMethod === 'pix' ? '#2563eb' : '#ddd'}`,
                    background: paymentMethod === 'pix' ? '#eff6ff' : '#fafafa',
                    color: paymentMethod === 'pix' ? '#1d4ed8' : '#555',
                    fontWeight: paymentMethod === 'pix' ? 700 : 400,
                    cursor: 'pointer', fontSize: '0.9rem',
                  }}
                >
                  🟢 PIX
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  style={{
                    flex: 1, padding: '0.6rem', borderRadius: '8px',
                    border: `2px solid ${paymentMethod === 'credit_card' ? '#2563eb' : '#ddd'}`,
                    background: paymentMethod === 'credit_card' ? '#eff6ff' : '#fafafa',
                    color: paymentMethod === 'credit_card' ? '#1d4ed8' : '#555',
                    fontWeight: paymentMethod === 'credit_card' ? 700 : 400,
                    cursor: 'pointer', fontSize: '0.9rem',
                  }}
                >
                  💳 Cartão
                </button>
              </div>
            </div>
            {!isFixedAmount && (
              <div className="form-group">
                <label>{t('modal.valueLabel')}</label>
                <input 
                  type="number" 
                  min="5" 
                  step="1" 
                  placeholder={t('modal.valuePlaceholder')} 
                  value={customValue}
                  onChange={e => setCustomValue(e.target.value)}
                  required
                />
              </div>
            )}


            <div className="form-group">
              <label>{t('oneTime.cpfLabel', 'CPF ou CNPJ')}</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpfCnpj}
                onChange={e => setCpfCnpj(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.25rem', display: 'block' }}>
                Exigido pelo Banco Central para emissão do PIX.
              </span>
            </div>

            {formError && (
              <div style={{
                backgroundColor: '#fde8e8',
                color: '#c0392b',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
              }}>
                {formError}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? t('oneTime.submitting', 'Gerando PIX…') : t('modal.button')}
            </button>
          </form>
        )}

        <p className="modal-footer">
          {t('modal.footer')}
        </p>
      </div>
    </div>
  );
}

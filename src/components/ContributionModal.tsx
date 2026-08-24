import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../pages/Mission.css';

export type ContributionTier = 'apoio' | 'livre';
export type Periodicity = 'mensal' | 'anual' | 'unica';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTier?: ContributionTier;
  initialPeriodicity?: Periodicity;
}

export function ContributionModal({ isOpen, onClose, initialTier = 'apoio', initialPeriodicity = 'mensal' }: ContributionModalProps) {
  const { t } = useTranslation('contribution');
  const [tier, setTier] = useState<ContributionTier>(initialTier);
  const [periodicity, setPeriodicity] = useState<Periodicity>(initialPeriodicity);
  const [customValue, setCustomValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Mapeamento dos links de pagamento do Asaas
    const asaasLinks: Record<string, string> = {
      'apoio_mensal': 'https://www.asaas.com/c/ubvo22er3ta93gsu',
      'apoio_anual': 'https://www.asaas.com/c/zc0gqi05xcw920e1',
      'livre_unica': 'https://www.asaas.com/c/ej6xz049gg63f7qi',
      'livre_mensal': 'https://www.asaas.com/c/hju0fp9mzkw9t5g2'
    };

    const linkKey = `${tier}_${periodicity}`;
    let checkoutUrl = asaasLinks[linkKey];

    if (checkoutUrl) {
      if (tier === 'livre' && customValue) {
        checkoutUrl = `${checkoutUrl}?value=${customValue}`;
      }
      window.open(checkoutUrl, '_blank');
      setIsSubmitting(false);
    } else {
      alert(t('modal.errorNoLink'));
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

          {tier === 'livre' && (
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

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? t('modal.buttonLoading') : t('modal.button')}
          </button>
        </form>

        <p className="modal-footer">
          {t('modal.footer')}
        </p>
      </div>
    </div>
  );
}

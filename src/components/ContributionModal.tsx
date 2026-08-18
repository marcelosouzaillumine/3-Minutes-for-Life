import React, { useState } from 'react';
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
      'apoio_mensal': 'https://www.asaas.com/c/p6w7aqj3q73z0s6p',
      'apoio_anual': 'https://www.asaas.com/c/ixokaznn11xejuir',
      'livre_unica': 'https://www.asaas.com/c/cfo4mysapw0wlk4i',
      'livre_mensal': 'https://www.asaas.com/c/vye9xaj09lcim8x7'
    };

    const linkKey = `${tier}_${periodicity}`;
    const checkoutUrl = asaasLinks[linkKey];

    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    } else {
      alert('Link de pagamento não configurado para esta opção.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <h2 className="modal-title">Fazer parte da missão</h2>
        <p className="modal-desc">
          O 3 Minutos para a Vida é gratuito. Sua contribuição ajuda outra pessoa a receber também.
        </p>

        <form className="modal-form" onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label>Tipo de Contribuição</label>
            <select value={tier} onChange={e => {
              const newTier = e.target.value as ContributionTier;
              setTier(newTier);
              if (newTier === 'apoio' && periodicity === 'unica') setPeriodicity('mensal');
              if (newTier === 'livre' && periodicity === 'anual') setPeriodicity('mensal');
            }}>
              <option value="apoio">Apoio (R$ 9,90/mês ou R$ 59,90/ano)</option>
              <option value="livre">Valor Livre</option>
            </select>
          </div>

          <div className="form-group">
            <label>Periodicidade</label>
            <select value={periodicity} onChange={e => setPeriodicity(e.target.value as Periodicity)}>
              {tier === 'apoio' && (
                <>
                  <option value="mensal">Mensal (R$ 9,90)</option>
                  <option value="anual">Anual (R$ 59,90)</option>
                </>
              )}
              {tier === 'livre' && (
                <>
                  <option value="unica">Única</option>
                  <option value="mensal">Mensal</option>
                </>
              )}
            </select>
          </div>

          {tier === 'livre' && (
            <div className="form-group">
              <label>Valor (R$)</label>
              <input 
                type="number" 
                min="5" 
                step="1" 
                placeholder="Ex: 50" 
                value={customValue}
                onChange={e => setCustomValue(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Preparando checkout...' : 'Continuar'}
          </button>
        </form>

        <p className="modal-footer">
          Ambiente seguro. Você poderá cancelar sua contribuição mensal a qualquer momento.
        </p>
      </div>
    </div>
  );
}

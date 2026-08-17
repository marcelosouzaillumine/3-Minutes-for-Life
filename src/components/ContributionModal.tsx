import React, { useState } from 'react';
import '../pages/Mission.css';

export type ContributionTier = 'semente' | 'parceiro' | 'mantenedor' | 'livre';
export type Periodicity = 'mensal' | 'anual' | 'unica';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTier?: ContributionTier;
  initialPeriodicity?: Periodicity;
}

export function ContributionModal({ isOpen, onClose, initialTier = 'parceiro', initialPeriodicity = 'mensal' }: ContributionModalProps) {
  const [tier, setTier] = useState<ContributionTier>(initialTier);
  const [periodicity, setPeriodicity] = useState<Periodicity>(initialPeriodicity);
  const [customValue, setCustomValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Aqui entrará a integração com o Asaas no futuro.
    // Por enquanto, simulamos o processamento estruturado.
    const payload = {
      tier,
      periodicity,
      value: tier === 'livre' ? customValue : null
    };
    
    console.log('Preparando checkout com os dados:', payload);
    
    setTimeout(() => {
      alert('Integração com Asaas em desenvolvimento. Obrigado pela intenção!');
      setIsSubmitting(false);
      onClose();
    }, 1500);
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
            <select value={tier} onChange={e => setTier(e.target.value as ContributionTier)}>
              <option value="semente">Semente (R$ 9,90/mês)</option>
              <option value="parceiro">Parceiro (R$ 19,90/mês)</option>
              <option value="mantenedor">Mantenedor (R$ 29,90/mês)</option>
              <option value="livre">Valor Livre</option>
            </select>
          </div>

          <div className="form-group">
            <label>Periodicidade</label>
            <select value={periodicity} onChange={e => setPeriodicity(e.target.value as Periodicity)}>
              {tier !== 'livre' && (
                <>
                  <option value="mensal">Mensal</option>
                  <option value="anual">Anual</option>
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

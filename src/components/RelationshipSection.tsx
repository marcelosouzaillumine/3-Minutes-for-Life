import { TestimonialSection } from './TestimonialSection';
import { PrayerRequestSection } from './PrayerRequestSection';

interface RelationshipSectionProps {
  devotionalId?: string;
  onSuccess?: () => void;
}

/**
 * Área de Relacionamento ao final do Devocional:
 * - Card 1: Testemunho (com Authentication Gate)
 * - Card 2: Pedido de Oração (com Authentication Gate)
 *
 * Visível tanto para visitantes anônimos quanto para usuários autenticados.
 */
export function RelationshipSection({ devotionalId, onSuccess }: RelationshipSectionProps) {
  return (
    <div className="relationship-section" style={{ marginTop: '2rem' }}>
      <TestimonialSection devotionalId={devotionalId} onSuccess={onSuccess} />
      <PrayerRequestSection devotionalId={devotionalId} />
    </div>
  );
}

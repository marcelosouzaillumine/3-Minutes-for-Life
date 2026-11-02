import type { Band } from '../services/FamilyService';

const label = (b: Band) => b.replace('-', ' a ');

/**
 * Escolha da versão da leitura (faixa de idade). Cada opção diz para quem é (as crianças daquela faixa que estão à mesa)
 * e a escolhida fica cheia, com ✓, para não haver dúvida de qual versão vai abrir.
 */
export function BandPicker({ bands, value, names, years, ariaLabel, onPick }: {
  bands: Band[];
  value: Band | null;
  /** Apelidos das crianças presentes em cada faixa. */
  names: Partial<Record<Band, string[]>>;
  years: string;
  ariaLabel: string;
  onPick: (b: Band) => void;
}) {
  return (
    <div className="bandpick" role="radiogroup" aria-label={ariaLabel}>
      {bands.map((b) => {
        const on = b === value;
        return (
          <button key={b} type="button" role="radio" aria-checked={on} className={`bandpick__opt${on ? ' is-on' : ''}`} onClick={() => onPick(b)}>
            <b>{label(b)} {years}</b>
            <span>{(names[b] ?? []).join(', ')}</span>
            {on && <i aria-hidden="true">✓</i>}
          </button>
        );
      })}
    </div>
  );
}

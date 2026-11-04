import type { Band } from '../services/FamilyService';

const label = (b: Band) => b.replace('-', ' a ');
const ORDER: Band[] = ['0-3', '4-6', '7-10', '11-13'];

/**
 * Escolha da versão da leitura (faixa de idade). Cada opção diz para quem é (as crianças daquela faixa que estão à mesa)
 * e a escolhida fica marcada, com ✓, para não haver dúvida de qual versão vai abrir.
 * Com "cards", a opção vira um cartão com a arte e uma frase do devocional naquela faixa.
 */
export function BandPicker({ bands, unavailable = [], unavailableLabel, value, names, years, ariaLabel, onPick, cards, forLabel }: {
  bands: Band[];
  /** Faixas sem versão neste devocional: aparecem apagadas, com o rótulo `unavailableLabel`. */
  unavailable?: Band[];
  unavailableLabel?: string;
  value: Band | null;
  /** Apelidos das crianças presentes em cada faixa. */
  names: Partial<Record<Band, string[]>>;
  years: string;
  ariaLabel: string;
  onPick: (b: Band) => void;
  /** Imagem e frase de cada faixa neste devocional; sem isso (ou sem arte), a opção é só o botão com a idade. */
  cards?: Partial<Record<Band, { image: string | null; text: string }>>;
  /** Prefixo da linha com os nomes ("Para: Ju"), para ficar claro que são as crianças dessa faixa. */
  forLabel?: string;
}) {
  const withCards = !!cards && bands.some((b) => cards[b]?.image);
  return (
    <div className={`bandpick${withCards ? ' bandpick--cards' : ''}`} role="radiogroup" aria-label={ariaLabel}>
      {ORDER.filter((b) => bands.includes(b) || unavailable.includes(b)).map((b) => {
        if (!bands.includes(b)) {
          return (
            <div key={b} className={`bandpick__opt bandpick__opt--off${withCards ? ' bandpick__opt--card' : ''}`} aria-disabled="true">
              {withCards && <span className="bandpick__img bandpick__img--empty" aria-hidden="true" />}
              <span className="bandpick__body"><b>{label(b)} {years}</b><span className="bandpick__text">{unavailableLabel}</span></span>
            </div>
          );
        }
        const on = b === value;
        const card = withCards ? cards?.[b] : undefined;
        const who = (names[b] ?? []).join(', ');
        return (
          <button key={b} type="button" role="radio" aria-checked={on} className={`bandpick__opt${on ? ' is-on' : ''}${card ? ' bandpick__opt--card' : ''}`} onClick={() => onPick(b)}>
            {card?.image && <img className="bandpick__img" src={card.image} alt="" loading="lazy" />}
            <span className="bandpick__body">
              <b>{label(b)} {years}</b>
              {card?.text && <span className="bandpick__text">{card.text}</span>}
              <span className="bandpick__who">{who && forLabel ? `${forLabel}: ${who}` : who}</span>
            </span>
            {on && <i aria-hidden="true">✓</i>}
          </button>
        );
      })}
    </div>
  );
}

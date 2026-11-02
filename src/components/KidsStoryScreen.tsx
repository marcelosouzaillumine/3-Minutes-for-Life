import { useState } from 'react';
import type { KidStory } from '../services/FamilyService';
import { DILEMMA_STEPS, safeStoryImage, storyScreenCount } from '../utils/kidsStory';

type TT = (k: string, d: string | Record<string, unknown>, o?: Record<string, unknown>) => string;

/** A arte não leva texto: se não carregar (sem rede, arquivo que sumiu), a legenda segue legível e o espaço da imagem some. */
function Art({ src }: { src: string | null }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return null;
  return (
    <figure className="kstory__art">
      <img src={src} alt="" decoding="async" draggable={false} onError={() => setBroken(true)} />
    </figure>
  );
}

/**
 * Uma tela da história: um quadro (quadrinhos) ou um dos quatro momentos do dilema.
 * Legenda, fala e perguntas ficam em texto fora da imagem, então crescem com a fonte e com a tradução sem cobrir ninguém.
 */
export function KidsStoryScreen({ story, index, tt, picked, onPick }: {
  story: KidStory;
  index: number;
  tt: TT;
  /** Opção do dilema escolhida na mesa (só visual: ajuda a conversa, não é guardada). */
  picked?: number | null;
  onPick?: (i: number) => void;
}) {
  const total = storyScreenCount(story);
  const i = Math.max(0, Math.min(total - 1, index));

  if (story.format === 'panels') {
    const p = story.panels[i];
    return (
      <div className="kstory" data-format="panels">
        <p className="fam-eyebrow">{tt('storyPanel', 'Quadro {{n}} de {{total}}', { n: i + 1, total })}</p>
        <p className="kstory__cap">{p.caption}</p>
        <Art src={safeStoryImage(p.image)} />
        {p.speech && <p className="kstory__speech">{p.speech}</p>}
      </div>
    );
  }

  const label = [tt('dilemmaStep1', 'O dilema'), tt('dilemmaStep2', 'A decisão da mesa'), tt('dilemmaStep3', 'O que aconteceu'), tt('dilemmaStep4', 'E hoje?')][i];
  return (
    <div className="kstory" data-format="dilemma">
      <p className="fam-eyebrow">{label} · {i + 1}/{DILEMMA_STEPS}</p>
      {i === 0 && (
        <>
          <Art src={safeStoryImage(story.image)} />
          <p className="kstory__text">{story.setup}</p>
          <p className="kstory__q">{story.question}</p>
        </>
      )}
      {i === 1 && (
        <>
          <p className="kstory__q">{story.question}</p>
          <div className="kstory__opts" role="group" aria-label={story.question}>
            {story.options.map((o, k) => (
              <button key={k} type="button" className={`kstory__opt${picked === k ? ' is-on' : ''}`} aria-pressed={picked === k} onClick={() => onPick?.(k)}>{o}</button>
            ))}
          </div>
          <p className="fam-note">{tt('dilemmaPick', 'Cada um escolhe e explica em uma frase. Ainda não há resposta certa.')}</p>
        </>
      )}
      {i === 2 && (
        <>
          <p className="kstory__text">{story.outcome}</p>
          {story.quote && <blockquote className="kstory__quote">“{story.quote}”</blockquote>}
          <p className="kstory__q">{story.outcomeQuestion}</p>
        </>
      )}
      {i === 3 && (
        <>
          <p className="kstory__text">{story.today}</p>
          <p className="kstory__q">{story.todayQuestion}</p>
        </>
      )}
    </div>
  );
}

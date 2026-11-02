import type { KidPanel, KidStory } from '../../services/FamilyService';
import { emptyStory } from '../../utils/kidsStory';

type Dilemma = Extract<KidStory, { format: 'dilemma' }>;
type Format = 'text' | 'panels' | 'dilemma';

const formatOf = (s: KidStory | null | undefined): Format => s?.format ?? 'text';

/** Preenche uma história: quadrinhos (arte + legenda + fala) ou dilema com debate. A arte é a mesma em todos os idiomas. */
export function KidsStoryEditor({ value, onChange, reference, translated }: {
  value: KidStory | null | undefined;
  onChange: (s: KidStory | null) => void;
  /** A mesma faixa em português, para quem traduz copiar a estrutura e ver o texto original. */
  reference: KidStory | null | undefined;
  translated: boolean;
}) {
  const format = formatOf(value);
  const ref = reference ?? null;
  const canCopy = translated && !!ref && JSON.stringify(value ?? null) !== JSON.stringify(ref);

  const pick = (f: Format) => {
    if (f === format) return;
    if (f === 'text') {
      if (value && !window.confirm('Voltar para só texto descarta os quadros ou o dilema desta faixa neste idioma. Continuar?')) return;
      onChange(null);
    } else onChange(emptyStory(f));
  };

  return (
    <fieldset className="studio__story">
      <legend>Como contar a história</legend>
      <div className="studio__formats" role="radiogroup" aria-label="Formato da história">
        {([['text', 'Só texto'], ['panels', 'Quadrinhos'], ['dilemma', 'Dilema com debate']] as [Format, string][]).map(([f, label]) => (
          <label key={f} className={`studio__format${format === f ? ' is-on' : ''}`}>
            <input type="radio" name="story-format" checked={format === f} onChange={() => pick(f)} /> {label}
          </label>
        ))}
      </div>
      <p className="fam-note">
        {format === 'text' && 'Texto corrido, como sempre foi.'}
        {format === 'panels' && 'Indicado para 4 a 6 e 7 a 10 anos. Um quadro por tela: legenda, arte e, se quiser, a fala de um personagem.'}
        {format === 'dilemma' && 'Indicado para 11 a 13 anos. O jovem decide antes de saber o que aconteceu; quatro telas: dilema, decisão da mesa, desfecho e “E hoje?”.'}
      </p>
      {canCopy && (
        <button type="button" className="fam-btn fam-btn--ghost" onClick={() => onChange(JSON.parse(JSON.stringify(ref)))}>
          Copiar a estrutura do português e traduzir os textos
        </button>
      )}
      {value?.format === 'panels' && <PanelsForm story={value} ref_={ref?.format === 'panels' ? ref : null} onChange={onChange} />}
      {value?.format === 'dilemma' && <DilemmaForm story={value} ref_={ref?.format === 'dilemma' ? ref : null} onChange={onChange} />}
    </fieldset>
  );
}

function PanelsForm({ story, ref_, onChange }: { story: Extract<KidStory, { format: 'panels' }>; ref_: Extract<KidStory, { format: 'panels' }> | null; onChange: (s: KidStory) => void }) {
  const set = (panels: KidPanel[]) => onChange({ format: 'panels', panels });
  const edit = (i: number, patch: Partial<KidPanel>) => set(story.panels.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= story.panels.length) return;
    const next = [...story.panels];
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
  };
  return (
    <div className="studio__panels">
      {story.panels.map((p, i) => {
        const r = ref_?.panels[i];
        return (
          <div key={i} className="studio__panel">
            <div className="studio__panel-head">
              <strong>Quadro {i + 1}</strong>
              <span>
                <button type="button" className="fam-btn fam-btn--ghost" aria-label={`Subir o quadro ${i + 1}`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                <button type="button" className="fam-btn fam-btn--ghost" aria-label={`Descer o quadro ${i + 1}`} disabled={i === story.panels.length - 1} onClick={() => move(i, 1)}>↓</button>
                <button type="button" className="fam-btn fam-btn--ghost" aria-label={`Remover o quadro ${i + 1}`} disabled={story.panels.length <= 2} onClick={() => set(story.panels.filter((_, k) => k !== i))}>Remover</button>
              </span>
            </div>
            {r && <p className="fam-note">Em português: {r.caption}{r.speech ? ` · “${r.speech}”` : ''}</p>}
            <div className="fam-form">
              <label>Arte (https:// ou /ilustracoes/…, sem texto dentro da imagem)
                <input value={p.image} placeholder="/ilustracoes/reforma-protestante/quadros/7-10-1.svg" onChange={(e) => edit(i, { image: e.target.value })} />
              </label>
              <label>Legenda (até 240 caracteres)
                <textarea rows={2} maxLength={240} value={p.caption} onChange={(e) => edit(i, { caption: e.target.value })} />
              </label>
              <label>Fala de um personagem (opcional, até 140)
                <input maxLength={140} value={p.speech ?? ''} onChange={(e) => edit(i, { speech: e.target.value })} />
              </label>
            </div>
          </div>
        );
      })}
      <button type="button" className="fam-btn fam-btn--secondary" disabled={story.panels.length >= 12} onClick={() => set([...story.panels, { image: '', caption: '' }])}>Adicionar quadro</button>
    </div>
  );
}

function DilemmaForm({ story, ref_, onChange }: { story: Dilemma; ref_: Dilemma | null; onChange: (s: KidStory) => void }) {
  const set = (patch: Partial<Dilemma>) => onChange({ ...story, ...patch });
  const field = (key: keyof Dilemma, label: string, rows: number, max: number) => (
    <label key={key}>{label} (até {max})
      {ref_ && typeof ref_[key] === 'string' && ref_[key] ? <span className="fam-note"> Em português: {ref_[key] as string}</span> : null}
      {rows === 1
        ? <input maxLength={max} value={(story[key] as string) ?? ''} onChange={(e) => set({ [key]: e.target.value })} />
        : <textarea rows={rows} maxLength={max} value={(story[key] as string) ?? ''} onChange={(e) => set({ [key]: e.target.value })} />}
    </label>
  );
  const setOpt = (i: number, v: string) => set({ options: story.options.map((o, k) => (k === i ? v : o)) });
  return (
    <div className="fam-form studio__dilemma">
      {field('teaser', 'Frase do cartão ao escolher a versão (opcional; sem ela vale a pergunta)', 1, 100)}
      {field('reference', 'Passagem bíblica, ex.: Lucas 10.38-42 (selo na abertura; Bíblia NAA em português)', 1, 60)}
      <label>Cena (opcional; https:// ou /ilustracoes/…, sem texto dentro da imagem)
        <input value={story.image ?? ''} placeholder="/ilustracoes/reforma-protestante/quadros/11-13-cena.svg" onChange={(e) => set({ image: e.target.value })} />
      </label>
      <label>Imagens dos 4 momentos (opcional; uma por linha, na ordem: dilema, decisão, desfecho, “E hoje?”)
        <textarea rows={4} value={(story.images ?? []).join('\n')} placeholder="/ilustracoes/reforma-protestante/quadros/faixa-11-13-1.webp" onChange={(e) => set({ images: e.target.value.split('\n') })} />
      </label>
      {field('setup', '1 · O dilema: a situação', 4, 800)}
      {field('question', '1 · A pergunta que o jovem responde antes do desfecho', 1, 200)}
      <fieldset className="studio__opts">
        <legend>2 · A decisão da mesa: 2 a 4 opções (até 120 cada)</legend>
        {ref_ && <p className="fam-note">Em português: {ref_.options.join(' · ')}</p>}
        {story.options.map((o, i) => (
          <div key={i} className="studio__opt">
            <input aria-label={`Opção ${i + 1}`} maxLength={120} value={o} onChange={(e) => setOpt(i, e.target.value)} />
            <button type="button" className="fam-btn fam-btn--ghost" aria-label={`Remover a opção ${i + 1}`} disabled={story.options.length <= 2} onClick={() => set({ options: story.options.filter((_, k) => k !== i) })}>Remover</button>
          </div>
        ))}
        <button type="button" className="fam-btn fam-btn--ghost" disabled={story.options.length >= 4} onClick={() => set({ options: [...story.options, ''] })}>Adicionar opção</button>
      </fieldset>
      {field('outcome', '3 · O que aconteceu', 4, 800)}
      {field('quote', '3 · Citação do desfecho (opcional)', 2, 240)}
      {field('quoteSource', '3 · Fonte da citação, ex.: Lucas 10.42 (opcional)', 1, 80)}
      {field('outcomeQuestion', '3 · Pergunta depois do desfecho', 1, 200)}
      {field('today', '4 · E hoje? O elo com a vida de agora', 3, 600)}
      {field('todayQuestion', '4 · Pergunta de “E hoje?”', 1, 200)}
    </div>
  );
}

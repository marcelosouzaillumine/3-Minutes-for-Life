import type { KidStory } from '../services/FamilyService';

/** Quantas telas a história ocupa na leitura: um quadro por tela, ou os quatro momentos do dilema. */
export const DILEMMA_STEPS = 4;
export const storyScreenCount = (s: KidStory): number => (s.format === 'panels' ? s.panels.length : DILEMMA_STEPS);

// Só https ou um arquivo do próprio app; qualquer outra coisa (http, javascript:, //host) não vira imagem.
const APP_ART = /^\/ilustracoes\/[a-z0-9][a-z0-9/_-]*\.(svg|png|webp|jpe?g)$/i;
export function safeStoryImage(url?: string | null): string | null {
  const u = (url ?? '').trim();
  if (!u) return null;
  if (u.startsWith('https://')) return encodeURI(u).replace(/['"()]/g, encodeURIComponent);
  return APP_ART.test(u) ? u : null;
}

/** Texto corrido da história. Igual ao da API: é a reserva de quem não tem suporte e a base de uma tradução. */
export function storyToText(s: KidStory): string {
  const parts = s.format === 'panels'
    ? s.panels.flatMap((p) => [p.caption, ...(p.speech ? [`“${p.speech}”`] : [])])
    : [s.setup, s.question, s.outcome, ...(s.quote ? [`“${s.quote}”`] : []), s.today];
  return parts.join('\n\n').slice(0, 4000);
}

const L = { caption: 240, speech: 140, setup: 800, question: 200, option: 120, outcome: 800, quote: 240, today: 600 };
const blank = (x?: string) => !(x ?? '').trim();
const tooLong = (x: string | undefined, max: number) => (x ?? '').trim().length > max;

/** Mensagem para a pessoa do editorial, ou null quando a história está pronta para salvar. Os limites são os da API. */
export function validateStory(s: KidStory | null | undefined): string | null {
  if (!s) return null;
  if (s.format === 'panels') {
    if (s.panels.length < 2) return 'Use pelo menos 2 quadros.';
    if (s.panels.length > 12) return 'Use no máximo 12 quadros.';
    for (const [i, p] of s.panels.entries()) {
      const n = i + 1;
      if (!safeStoryImage(p.image)) return `Quadro ${n}: informe a arte (https:// ou /ilustracoes/…).`;
      if (blank(p.caption)) return `Quadro ${n}: escreva a legenda.`;
      if (tooLong(p.caption, L.caption)) return `Quadro ${n}: a legenda passa de ${L.caption} caracteres.`;
      if (tooLong(p.speech, L.speech)) return `Quadro ${n}: a fala passa de ${L.speech} caracteres.`;
    }
    return null;
  }
  if (s.image && !safeStoryImage(s.image)) return 'Dilema: a cena precisa ser https:// ou /ilustracoes/…';
  const imgs = (s.images ?? []).map((x) => x.trim()).filter(Boolean);
  if (imgs.length > DILEMMA_STEPS) return `Dilema: no máximo ${DILEMMA_STEPS} imagens (uma por momento).`;
  if (imgs.some((x) => !safeStoryImage(x))) return 'Dilema: cada imagem precisa ser https:// ou /ilustracoes/…';
  const need: [string, string | undefined][] = [['a situação', s.setup], ['a pergunta', s.question], ['o que aconteceu', s.outcome], ['a pergunta depois do desfecho', s.outcomeQuestion], ['o texto de “E hoje?”', s.today], ['a pergunta de “E hoje?”', s.todayQuestion]];
  for (const [label, v] of need) if (blank(v)) return `Dilema: escreva ${label}.`;
  const opts = s.options.map((o) => o.trim()).filter(Boolean);
  if (opts.length < 2) return 'Dilema: escreva pelo menos 2 opções.';
  if (s.options.length > 4) return 'Dilema: no máximo 4 opções.';
  if (s.options.some((o) => tooLong(o, L.option))) return `Dilema: cada opção tem até ${L.option} caracteres.`;
  if (tooLong(s.setup, L.setup) || tooLong(s.outcome, L.outcome)) return `Dilema: a situação e o desfecho têm até ${L.setup} caracteres.`;
  if (tooLong(s.question, L.question) || tooLong(s.outcomeQuestion, L.question) || tooLong(s.todayQuestion, L.question)) return `Dilema: cada pergunta tem até ${L.question} caracteres.`;
  if (tooLong(s.quote, L.quote)) return `Dilema: a citação tem até ${L.quote} caracteres.`;
  if (tooLong(s.today, L.today)) return `Dilema: o texto de “E hoje?” tem até ${L.today} caracteres.`;
  return null;
}

/** Tira espaços e opções vazias antes de enviar, sem mudar a ordem. */
export function cleanStory(s: KidStory): KidStory {
  const t = (x?: string) => (x ?? '').trim();
  if (s.format === 'panels') {
    return { format: 'panels', panels: s.panels.map((p) => ({ image: t(p.image), caption: t(p.caption), ...(t(p.speech) ? { speech: t(p.speech) } : {}) })) };
  }
  return {
    format: 'dilemma', ...(t(s.image) ? { image: t(s.image) } : {}),
    ...((s.images ?? []).map(t).filter(Boolean).length ? { images: (s.images ?? []).map(t).filter(Boolean) } : {}),
    setup: t(s.setup), question: t(s.question), options: s.options.map(t).filter(Boolean),
    outcome: t(s.outcome), ...(t(s.quote) ? { quote: t(s.quote) } : {}), outcomeQuestion: t(s.outcomeQuestion),
    today: t(s.today), todayQuestion: t(s.todayQuestion),
  };
}

export const emptyStory = (format: 'panels' | 'dilemma'): KidStory => format === 'panels'
  ? { format, panels: [{ image: '', caption: '' }, { image: '', caption: '' }] }
  : { format, setup: '', question: '', options: ['', ''], outcome: '', outcomeQuestion: '', today: '', todayQuestion: '' };

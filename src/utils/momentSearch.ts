// Busca por "momento de vida": a pessoa escreve como está ("estou sem forças") e o app
// devolve os devocionais cujo texto mais conversa com isso. Sem IA e sem etiquetas por
// devocional: compara palavras (sem acento, por radical) e usa grupos de sinônimos mantidos
// aqui, uma vez só, em pt-BR, en e es.

export interface SearchableDevotional {
  id: string;
  title?: string | null;
  principle_statement?: string | null;
  scripture_reference?: string | null;
  scripture_text?: string | null;
  reflection?: string | null;
  practical_application?: string | null;
  prayer?: string | null;
}

const strip = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/<[^>]*>/g, ' ');

const tokens = (s: string) => strip(s).split(/[^a-z0-9]+/).filter(Boolean);

// Radical grosseiro e igual nos três idiomas: cansada/cansaço/cansar → "cansa".
const stem = (w: string) => (w.length >= 6 ? w.slice(0, 5) : w);

const STOPWORDS = new Set(
  `a o as os um uma uns umas de do da dos das em no na nos nas por para com sem sob sobre e ou mas que se como
   nao consigo consegue preciso precisa quero queria posso pode devo vou tomar fazer ter
   ao aos ate eu me meu minha meus minhas mim nos voce voces seu sua seus suas ele ela eles elas isso isto esse essa
   este esta estou estar esta estao to ta sinto sentir sentindo ando andando tenho ter tem hoje muito muita muitos
   tanto tanta mais menos ja so tambem ser sou e foi vai estou ainda pra pro num numa
   need want cant dont can do not have get
   i am im ive is are was be been the an and my me to of in for with it its that this today how you your so very much feel feeling felt
   no puedo necesito quiero
   estoy siento muy hoy mi el la los las un una y es lo del al con por para tengo estar estado me te se`
    .split(/\s+/).filter(Boolean),
);

const GROUPS: string[] = [
  // cansaço, falta de forças
  `cansado cansada cansaco exausto exausta esgotado esgotada forca forcas energia folego desanimo desanimado
   sobrecarregado sobrecarga estresse estressado descanso descansar repouso fraco fraca tired exhausted weary burnout
   drained rest strength agotado agotamiento cansancio fuerzas descanso`,
  // ansiedade, medo, incerteza
  `ansiedade ansioso ansiosa preocupacao preocupado preocupada aflicao aflito angustia angustiado nervoso nervosa medo
   temor receio apreensivo panico inseguranca inseguro futuro incerteza anxiety anxious worry worried fear afraid scared
   uncertain uncertainty ansiedad preocupacion miedo incertidumbre`,
  // tristeza, perda, luto
  `triste tristeza luto perda saudade saudades morte sofrimento dor choro chorar lagrimas desolado vazio depressao
   deprimido sad sadness grief loss pain suffering tears empty depressed pena perdida dolor sufrimiento vacio`,
  // gratidão, alegria
  `gratidao grato grata agradecido agradecida agradecer obrigado alegria alegre feliz contente celebrar bencao bencaos
   gratitude grateful thankful thanks joy happy blessing gratitud alegria bendicion`,
  // decisão, direção, dúvida
  `decisao decidir duvida duvidas indeciso encruzilhada caminho direcao rumo escolha escolher sabedoria discernimento
   orientacao decision decide doubt crossroads direction choose wisdom guidance decision dudas camino elegir sabiduria`,
  // perdão, culpa, raiva
  `perdao perdoar magoa magoado ressentimento rancor culpa culpado arrependimento arrependido raiva ira ofensa ofendido
   forgive forgiveness resentment guilt anger hurt regret perdon perdonar resentimiento enojo rencor`,
  // esperança, fé, confiança
  `esperanca esperar fe confianca confiar acreditar promessa fidelidade hope faith trust believe promise esperanza
   confianza promesa`,
  // recomeço, mudança
  `recomeco recomecar comecar novo nova mudanca mudar transformacao renovar renovacao fresh restart begin change renew
   renewal comenzar nuevo cambio renovar`,
  // solidão, rejeição
  `solidao sozinho sozinha abandono abandonado isolado isolamento rejeicao rejeitado lonely alone loneliness abandoned
   rejected soledad solo rechazo`,
  // família e relacionamentos
  `familia casamento marido esposa filhos filho filha pais mae pai amigo amigos amizade relacionamento conflito briga
   discussao family marriage spouse children parents friend friendship relationship conflict matrimonio hijos padres
   amistad`,
  // trabalho, propósito, dinheiro
  `trabalho emprego carreira profissao proposito vocacao missao chamado servico desemprego dinheiro financas provisao
   work job career purpose calling mission service money provision trabajo vocacion servicio dinero`,
  // paciência, espera
  `paciencia espera demora tempo processo perseveranca perseverar persistir paciente patience wait waiting perseverance
   paciencia`,
  // oração
  `oracao orar orando prece pray prayer oracion`,
  // saúde, doença
  `doenca doente saude cura curar enfermidade hospital diagnostico illness sick health healing disease enfermedad salud
   sanacion`,
  // fracasso, vergonha
  `fracasso falha falhei errei erro vergonha fracassado fail failure mistake shame fracaso vergüenza`,
];

// Nome estável de cada grupo, na mesma ordem de GROUPS (aparece no ranking do painel).
const TOPIC_KEYS = [
  'cansaco', 'ansiedade', 'tristeza', 'gratidao', 'decisao', 'perdao', 'esperanca', 'recomeco',
  'solidao', 'familia', 'trabalho', 'paciencia', 'oracao', 'saude', 'fracasso',
] as const;

// radical → grupos a que pertence
const GROUP_OF = new Map<string, number[]>();
const GROUP_STEMS: Set<string>[] = GROUPS.map((g, i) => {
  const set = new Set<string>();
  for (const w of tokens(g)) {
    const s = stem(w);
    set.add(s);
    GROUP_OF.set(s, [...(GROUP_OF.get(s) ?? []), i]);
  }
  return set;
});

const FIELDS: [keyof SearchableDevotional, number][] = [
  ['title', 5],
  ['principle_statement', 4],
  ['scripture_reference', 1],
  ['scripture_text', 2],
  ['reflection', 2],
  ['practical_application', 1],
  ['prayer', 1],
];

const SYNONYM_WEIGHT = 0.5;

const indexCache = new WeakMap<object, Map<string, [Set<string>, number][]>>();

function fieldStems(list: readonly SearchableDevotional[]) {
  let idx = indexCache.get(list);
  if (!idx) {
    idx = new Map();
    for (const d of list) {
      idx.set(
        d.id,
        FIELDS.map(([f, w]) => [new Set(tokens(String(d[f] ?? '')).map(stem)), w] as [Set<string>, number]),
      );
    }
    indexCache.set(list, idx);
  }
  return idx;
}

export interface MomentMatch<T> {
  devotional: T;
  score: number;
}

/** Devocionais mais próximos do que a pessoa escreveu, do mais ao menos relevante. */
export function searchMoments<T extends SearchableDevotional>(
  query: string,
  library: readonly T[],
  limit = 6,
): MomentMatch<T>[] {
  const direct = new Set(tokens(query).filter((w) => !STOPWORDS.has(w) && w.length > 1).map(stem));
  if (!direct.size) return [];

  // radical → peso (direto vale 1; vindo de sinônimo, metade)
  const wanted = new Map<string, number>();
  for (const s of direct) wanted.set(s, 1);
  for (const s of direct) {
    for (const g of GROUP_OF.get(s) ?? []) {
      for (const syn of GROUP_STEMS[g]) if (!wanted.has(syn)) wanted.set(syn, SYNONYM_WEIGHT);
    }
  }

  const index = fieldStems(library);
  const out: MomentMatch<T>[] = [];
  for (const d of library) {
    let score = 0;
    for (const [stems, weight] of index.get(d.id) ?? []) {
      for (const [s, w] of wanted) if (stems.has(s)) score += weight * w;
    }
    if (score > 0) out.push({ devotional: d, score });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

const directStems = (query: string) =>
  new Set(tokens(query).filter((w) => !STOPWORDS.has(w) && w.length > 1).map(stem));

/** Temas (cansaço, ansiedade…) que a frase toca. Serve ao painel, nunca à pessoa. */
export function topicsOf(query: string): string[] {
  const out = new Set<string>();
  for (const s of directStems(query)) for (const g of GROUP_OF.get(s) ?? []) out.add(TOPIC_KEYS[g]);
  return [...out];
}

/**
 * Palavras úteis da frase para estatística: sem palavras vazias, só letras, até 24 caracteres, no
 * máximo 5. A frase inteira nunca é guardada, porque quem escreve conta coisas pessoais.
 */
export function significantWords(query: string): string[] {
  const seen = new Set<string>();
  for (const w of query.toLowerCase().match(/\p{L}+/gu) ?? []) {
    if (w.length < 3 || w.length > 24 || STOPWORDS.has(strip(w))) continue;
    seen.add(w);
    if (seen.size === 5) break;
  }
  return [...seen];
}

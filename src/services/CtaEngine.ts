import { normalizeEditorialContent } from '../components/HtmlRenderer';
import { extractStructure, type StructuralBlock } from '../lib/contentStructure';

export interface CtaDefinition {
  id: string;
  type: 'auth_acquisition' | 'share_viral' | 'support_channel' | 'relationship' | 'custom';
  targetAudience: 'anonymous' | 'authenticated' | 'all';
  translations: Record<string, {
    title: string;
    description: string;
    label: string;
  }>;
  url?: string;
  action?: string;
}

/**
 * Standard CTA Library for automated platform-driven acquisition & continuity.
 *
 * NOTE: Relationship CTAs (Testimony & Prayer Request) belong strictly to the
 * Relationship area at the bottom of the devotional and are not inserted into
 * editorial reflection content by the CtaEngine.
 */
export const CTA_LIBRARY: Record<string, CtaDefinition> = {
  ANONYMOUS_ACQUISITION: {
    id: 'anonymous_acquisition',
    type: 'auth_acquisition',
    targetAudience: 'anonymous',
    url: '/signup',
    translations: {
      'pt-BR': {
        title: 'Que estes três minutos não terminem aqui.',
        description: 'Amanhã, uma nova reflexão espera por você. Entre ou crie sua conta para guardar suas anotações e acompanhar sua jornada.',
        label: 'Quero continuar',
      },
      'en': {
        title: 'May these three minutes not end here.',
        description: 'Tomorrow, a fresh reflection awaits you. Sign in or create your account to save personal notes and track your journey.',
        label: 'Continue my journey',
      },
      'es': {
        title: 'Que estos tres minutos no terminen aquí.',
        description: 'Mañana, una nueva reflexión te espera. Inicia sesión o crea tu cuenta para guardar tus notas y seguir tu camino.',
        label: 'Quiero continuar',
      },
    },
  },
};

export interface CtaEngineOptions {
  user?: any | null;
  language?: string;
}

/**
 * Calculates the semantic target index where the CTA should be placed.
 *
 * Rules:
 *  - 1–2 paragraphs: after paragraph 1 or 2 (at the end)
 *  - 3–4 paragraphs: after paragraph 2
 *  - 5–7 paragraphs: after paragraph 3 or 4 (~60–65%)
 *  - 8+ paragraphs:  ~65% of paragraphs
 */
export function calculateSemanticInsertionIndex(paragraphCount: number): number {
  if (paragraphCount <= 2) {
    return paragraphCount;
  }
  if (paragraphCount <= 4) {
    return 2;
  }
  if (paragraphCount <= 7) {
    return Math.floor(paragraphCount * 0.6);
  }
  return Math.max(2, Math.floor(paragraphCount * 0.65));
}

/**
 * Normalizes language key to supported ISO keys ('pt-BR', 'en', 'es').
 */
function normalizeLangKey(lang?: string): 'pt-BR' | 'en' | 'es' {
  if (!lang) return 'pt-BR';
  const lower = lang.toLowerCase();
  if (lower.startsWith('es')) return 'es';
  if (lower.startsWith('en')) return 'en';
  return 'pt-BR';
}

export const CtaEngine = {
  /**
   * Composes editorial content by injecting a single automated acquisition CTA
   * for anonymous visitors while respecting manual CTAs, paragraph semantics, and localization.
   * Authenticated users receive pure editorial content without automated acquisition CTAs.
   */
  composeReflection(rawHtml?: string | null, options: CtaEngineOptions = {}): string {
    if (!rawHtml) return '';

    const normalized = normalizeEditorialContent(rawHtml);
    if (!normalized) return '';

    // 1. If content already contains a manual editorial CTA, it has maximum priority — never duplicate
    const existingBlocks = extractStructure(normalized);
    const hasManualCta = existingBlocks.some((b) => b.type === 'cta');
    if (hasManualCta) {
      return normalized;
    }

    // 2. Audience Segmentation: Authenticated users NEVER receive the acquisition CTA in reflection
    if (options.user) {
      return normalized;
    }

    // 3. Obtain localized definition for the Acquisition / Continuity CTA
    const langKey = normalizeLangKey(options.language);
    const ctaDef = CTA_LIBRARY.ANONYMOUS_ACQUISITION;
    const loc = ctaDef.translations[langKey] || ctaDef.translations['pt-BR'];

    const ctaDiv = `<div data-type="cta" data-title="${loc.title}" data-description="${loc.description}" data-label="${loc.label}" data-url="${ctaDef.url || '/signup'}" data-action=""></div>`;

    // 4. Parse paragraphs semantically
    const paragraphRegex = /<p\b[^>]*>[\s\S]*?<\/p>/gi;
    const paragraphs: string[] = [];
    let match;

    while ((match = paragraphRegex.exec(normalized)) !== null) {
      paragraphs.push(match[0]);
    }

    // If no <p> tags were matched, append at the end
    if (paragraphs.length === 0) {
      return `${normalized}\n${ctaDiv}`;
    }

    const insertionPoint = calculateSemanticInsertionIndex(paragraphs.length);

    // Insert CTA after the calculated paragraph
    const before = paragraphs.slice(0, insertionPoint).join('\n');
    const after = paragraphs.slice(insertionPoint).join('\n');

    if (after) {
      return `${before}\n${ctaDiv}\n${after}`;
    }
    return `${before}\n${ctaDiv}`;
  },

  /**
   * Direct block-level composition: takes StructuralBlocks and returns composed blocks
   */
  composeBlocks(blocks: StructuralBlock[], options: CtaEngineOptions = {}): StructuralBlock[] {
    const hasManualCta = blocks.some((b) => b.type === 'cta');
    if (hasManualCta || options.user) {
      return blocks;
    }

    const langKey = normalizeLangKey(options.language);
    const ctaDef = CTA_LIBRARY.ANONYMOUS_ACQUISITION;
    const loc = ctaDef.translations[langKey] || ctaDef.translations['pt-BR'];

    const acquisitionBlock: StructuralBlock = {
      type: 'cta',
      attrs: {
        title: loc.title,
        description: loc.description,
        label: loc.label,
        url: ctaDef.url || '/signup',
        action: '',
      },
      index: 0,
    };

    if (blocks.length <= 2) {
      return [...blocks, acquisitionBlock];
    }

    const insertIdx = calculateSemanticInsertionIndex(blocks.length);
    const result = [...blocks];
    result.splice(insertIdx, 0, acquisitionBlock);
    return result;
  },
};

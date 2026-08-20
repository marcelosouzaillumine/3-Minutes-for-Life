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
 * Standard CTA Library for automated platform-driven relationship & engagement.
 */
export const CTA_LIBRARY: Record<string, CtaDefinition> = {
  TESTIMONY: {
    id: 'anonymous_testimony',
    type: 'relationship',
    targetAudience: 'all',
    action: 'testimony',
    translations: {
      'pt-BR': {
        title: 'Como essa reflexão tocou você?',
        description: 'Seu relato pode ajudar nossa equipe a compreender o que Deus está fazendo na vida de quem caminha com o 3 Minutes for Life.',
        label: 'Compartilhar meu testemunho',
      },
      'en': {
        title: 'How did this reflection speak to you?',
        description: 'Your story can help our team understand what God is doing in the lives of those walking with 3 Minutes for Life.',
        label: 'Share my testimony',
      },
      'es': {
        title: '¿Cómo te habló esta reflexión?',
        description: 'Tu experiencia puede ayudar a nuestro equipo a comprender lo que Dios está haciendo en la vida de quienes caminan con 3 Minutes for Life.',
        label: 'Compartir mi testimonio',
      },
    },
  },
  PRAYER_REQUEST: {
    id: 'anonymous_prayer_request',
    type: 'relationship',
    targetAudience: 'all',
    action: 'prayer_request',
    translations: {
      'pt-BR': {
        title: 'Podemos orar por você?',
        description: 'Compartilhe seu pedido de oração com nossa equipe. Vamos recebê-lo com cuidado e colocá-lo diante de Deus.',
        label: 'Enviar meu pedido de oração',
      },
      'en': {
        title: 'Can we pray for you?',
        description: 'Share your prayer request with our team. We will receive it with care and bring it before God.',
        label: 'Send my prayer request',
      },
      'es': {
        title: '¿Podemos orar por ti?',
        description: 'Comparte tu motivo de oración con nuestro equipo. Lo recibiremos con cuidado y lo presentaremos ante Dios.',
        label: 'Enviar mi petición de oración',
      },
    },
  },
};

export interface CtaEngineOptions {
  user?: any | null;
  language?: string;
}

/**
 * Calculates the semantic target index where the CTAs should be placed.
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
   * Composes editorial content by injecting automated relationship CTAs
   * ([Testimony] ↓ [Prayer Request]) for all visitors (anonymous + authenticated)
   * while respecting manual CTAs, paragraph semantics, and localization.
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

    // 2. Obtain localized definitions for both CTAs (Relationship CTAs are visible to all audiences)
    const langKey = normalizeLangKey(options.language);
    const tDef = CTA_LIBRARY.TESTIMONY;
    const pDef = CTA_LIBRARY.PRAYER_REQUEST;
    const tLoc = tDef.translations[langKey] || tDef.translations['pt-BR'];
    const pLoc = pDef.translations[langKey] || pDef.translations['pt-BR'];

    const testimonyDiv = `<div data-type="cta" data-title="${tLoc.title}" data-description="${tLoc.description}" data-label="${tLoc.label}" data-url="${tDef.url || ''}" data-action="${tDef.action || ''}"></div>`;
    const prayerDiv = `<div data-type="cta" data-title="${pLoc.title}" data-description="${pLoc.description}" data-label="${pLoc.label}" data-url="${pDef.url || ''}" data-action="${pDef.action || ''}"></div>`;
    const ctaSequence = `${testimonyDiv}\n${prayerDiv}`;

    // 3. Parse paragraphs semantically
    const paragraphRegex = /<p\b[^>]*>[\s\S]*?<\/p>/gi;
    const paragraphs: string[] = [];
    let match;

    while ((match = paragraphRegex.exec(normalized)) !== null) {
      paragraphs.push(match[0]);
    }

    // If no <p> tags were matched, append at the end
    if (paragraphs.length === 0) {
      return `${normalized}\n${ctaSequence}`;
    }

    const insertionPoint = calculateSemanticInsertionIndex(paragraphs.length);

    // Insert CTA sequence after the calculated paragraph
    const before = paragraphs.slice(0, insertionPoint).join('\n');
    const after = paragraphs.slice(insertionPoint).join('\n');

    if (after) {
      return `${before}\n${ctaSequence}\n${after}`;
    }
    return `${before}\n${ctaSequence}`;
  },

  /**
   * Direct block-level composition: takes StructuralBlocks and returns composed blocks
   */
  composeBlocks(blocks: StructuralBlock[], options: CtaEngineOptions = {}): StructuralBlock[] {
    const hasManualCta = blocks.some((b) => b.type === 'cta');
    if (hasManualCta) {
      return blocks;
    }

    const langKey = normalizeLangKey(options.language);
    const tDef = CTA_LIBRARY.TESTIMONY;
    const pDef = CTA_LIBRARY.PRAYER_REQUEST;
    const tLoc = tDef.translations[langKey] || tDef.translations['pt-BR'];
    const pLoc = pDef.translations[langKey] || pDef.translations['pt-BR'];

    const testimonyBlock: StructuralBlock = {
      type: 'cta',
      attrs: {
        title: tLoc.title,
        description: tLoc.description,
        label: tLoc.label,
        url: tDef.url || '',
        action: tDef.action || '',
      },
      index: 0,
    };

    const prayerBlock: StructuralBlock = {
      type: 'cta',
      attrs: {
        title: pLoc.title,
        description: pLoc.description,
        label: pLoc.label,
        url: pDef.url || '',
        action: pDef.action || '',
      },
      index: 1,
    };

    // If there's only 1 or 2 blocks, insert at the end
    if (blocks.length <= 2) {
      return [...blocks, testimonyBlock, prayerBlock];
    }

    const insertIdx = calculateSemanticInsertionIndex(blocks.length);
    const result = [...blocks];
    result.splice(insertIdx, 0, testimonyBlock, prayerBlock);
    return result;
  },
};

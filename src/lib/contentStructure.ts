/**
 * contentStructure.ts
 *
 * Structural parser/reconstructor for editorial rich-text content.
 *
 * Rule: structure ≠ translatable content.
 *
 * Translatable:  paragraph text, heading text, CTA.title, CTA.description, CTA.label
 * NOT translatable: CTA.url, CTA.action, node position, technical attributes
 *
 * A translation must NEVER alter, remove, duplicate or reposition a CTA block.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CtaAttrs {
  title: string;
  description: string;
  label: string;
  /** URL is structural — never translated */
  url: string;
  /** action is structural — never translated */
  action: string;
}

/**
 * A structural block is either:
 *  - 'html'  → a run of standard HTML (paragraphs, headings, lists, etc.)
 *  - 'cta'   → an atomic CTA editorial block
 */
export type StructuralBlock =
  | { type: 'html'; content: string }
  | { type: 'cta'; attrs: CtaAttrs; index: number };

// ─── CTA HTML pattern ─────────────────────────────────────────────────────────

/** Matches a full `<div data-type="cta" ...></div>` tag (self-closing or empty). */
const CTA_PATTERN = /<div\s[^>]*data-type=["']cta["'][^>]*><\/div>/gi;

function parseCtaAttrs(html: string): CtaAttrs {
  const get = (attr: string) => {
    const m = html.match(new RegExp(`data-${attr}=["']([^"']*)["']`));
    return m ? m[1] : '';
  };
  return {
    title:       get('title'),
    description: get('description'),
    label:       get('label'),
    url:         get('url'),
    action:      get('action'),
  };
}

function buildCtaHtml(attrs: CtaAttrs): string {
  const escape = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return (
    `<div data-type="cta"` +
    ` data-title="${escape(attrs.title)}"` +
    ` data-description="${escape(attrs.description)}"` +
    ` data-label="${escape(attrs.label)}"` +
    ` data-url="${escape(attrs.url)}"` +
    ` data-action="${escape(attrs.action)}"></div>`
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Decomposes an HTML string into structural blocks.
 *
 * @example
 * extractStructure('<p>Hello</p><div data-type="cta" ...></div><p>World</p>')
 * // → [
 * //     { type: 'html', content: '<p>Hello</p>' },
 * //     { type: 'cta', attrs: { title: '...', ... }, index: 0 },
 * //     { type: 'html', content: '<p>World</p>' },
 * //   ]
 */
export function extractStructure(html: string): StructuralBlock[] {
  if (!html) return [{ type: 'html', content: '' }];

  const blocks: StructuralBlock[] = [];
  let ctaIndex = 0;
  let lastIndex = 0;

  const pattern = new RegExp(CTA_PATTERN.source, 'gi');
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    // Collect HTML before this CTA
    if (match.index > lastIndex) {
      const before = html.slice(lastIndex, match.index).trim();
      if (before) blocks.push({ type: 'html', content: before });
    }

    blocks.push({
      type: 'cta',
      attrs: parseCtaAttrs(match[0]),
      index: ctaIndex++,
    });

    lastIndex = match.index + match[0].length;
  }

  // Trailing HTML after last CTA
  if (lastIndex < html.length) {
    const after = html.slice(lastIndex).trim();
    if (after) blocks.push({ type: 'html', content: after });
  }

  // If no CTAs found, return the original HTML as-is
  if (blocks.length === 0) {
    blocks.push({ type: 'html', content: html });
  }

  return blocks;
}

/**
 * Reconstructs an HTML string from structural blocks.
 * The position of each CTA is preserved exactly as decomposed.
 */
export function reconstructHtml(blocks: StructuralBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'html') return block.content;
      return buildCtaHtml(block.attrs);
    })
    .join('\n');
}

/**
 * Returns only the translatable text segments from a set of structural blocks.
 * Used to build a translation payload without structural noise.
 *
 * Layout:
 *   [html_block_0_content, cta_0_title, cta_0_description, cta_0_label, html_block_1_content, ...]
 *
 * For HTML blocks, the full HTML is included (the AI translates text inside tags).
 * For CTA blocks, only title/description/label are included (url/action are excluded).
 */
export interface TranslationPayload {
  segments: string[];
  /** For each segment, describes its origin so we can reconstruct after translation */
  manifest: Array<
    | { kind: 'html'; blockIndex: number }
    | { kind: 'cta_title'; blockIndex: number }
    | { kind: 'cta_description'; blockIndex: number }
    | { kind: 'cta_label'; blockIndex: number }
  >;
}

export function buildTranslationPayload(blocks: StructuralBlock[]): TranslationPayload {
  const segments: string[] = [];
  const manifest: TranslationPayload['manifest'] = [];

  blocks.forEach((block, i) => {
    if (block.type === 'html') {
      segments.push(block.content);
      manifest.push({ kind: 'html', blockIndex: i });
    } else {
      // CTA: only translatable text fields
      if (block.attrs.title) {
        segments.push(block.attrs.title);
        manifest.push({ kind: 'cta_title', blockIndex: i });
      }
      if (block.attrs.description) {
        segments.push(block.attrs.description);
        manifest.push({ kind: 'cta_description', blockIndex: i });
      }
      if (block.attrs.label) {
        segments.push(block.attrs.label);
        manifest.push({ kind: 'cta_label', blockIndex: i });
      }
    }
  });

  return { segments, manifest };
}

/**
 * Applies translated segments back onto the structural blocks.
 * url and action are NEVER modified.
 *
 * @param blocks   Original structural blocks (from extractStructure)
 * @param manifest Original manifest (from buildTranslationPayload)
 * @param translated Translated segments in the same order as manifest
 */
export function applyTranslations(
  blocks: StructuralBlock[],
  manifest: TranslationPayload['manifest'],
  translated: string[]
): StructuralBlock[] {
  // Deep-clone blocks so we don't mutate the originals
  const result: StructuralBlock[] = blocks.map((b) =>
    b.type === 'cta' ? { ...b, attrs: { ...b.attrs } } : { ...b }
  );

  manifest.forEach((entry, i) => {
    const value = translated[i] ?? '';
    const block = result[entry.blockIndex];

    if (entry.kind === 'html' && block.type === 'html') {
      block.content = value;
    } else if (block.type === 'cta') {
      if (entry.kind === 'cta_title')       block.attrs.title       = value;
      if (entry.kind === 'cta_description') block.attrs.description = value;
      if (entry.kind === 'cta_label')       block.attrs.label       = value;
      // url and action intentionally untouched
    }
  });

  return result;
}

/**
 * One-shot helper: given an original HTML string and a translation function,
 * returns the fully reconstructed translated HTML with all CTAs preserved.
 *
 * @param html           Original HTML (may contain CTA blocks)
 * @param translateFn    Async function that translates an array of segments
 * @returns              Translated HTML with CTA positions, url, and action intact
 */
export async function translatePreservingStructure(
  html: string,
  translateFn: (segments: string[]) => Promise<string[]>
): Promise<string> {
  const blocks = extractStructure(html);
  const { segments, manifest } = buildTranslationPayload(blocks);

  if (segments.length === 0) return html;

  const translated = await translateFn(segments);
  const rebuiltBlocks = applyTranslations(blocks, manifest, translated);
  return reconstructHtml(rebuiltBlocks);
}

/**
 * Validates structural parity between original and translated HTML.
 *
 * Verifies:
 * 1. Exact count of CTA nodes matches.
 * 2. Block sequence (html vs cta) is identical.
 * 3. Every CTA preserves its exact `url` and `action` invariants.
 *
 * @returns { isValid: boolean, errors: string[] }
 */
export function validateStructuralIntegrity(
  originalHtml: string,
  translatedHtml: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  const originalBlocks = extractStructure(originalHtml);
  const translatedBlocks = extractStructure(translatedHtml);

  // 1. Total block count & type alignment
  if (originalBlocks.length !== translatedBlocks.length) {
    errors.push(
      `Block count mismatch: original has ${originalBlocks.length} blocks, translated has ${translatedBlocks.length} blocks.`
    );
  }

  const originalCtas = originalBlocks.filter((b): b is { type: 'cta'; attrs: CtaAttrs; index: number } => b.type === 'cta');
  const translatedCtas = translatedBlocks.filter((b): b is { type: 'cta'; attrs: CtaAttrs; index: number } => b.type === 'cta');

  if (originalCtas.length !== translatedCtas.length) {
    errors.push(
      `CTA count mismatch: original has ${originalCtas.length} CTAs, translated has ${translatedCtas.length} CTAs.`
    );
  }

  // 2. Position and invariant checks
  const maxLen = Math.min(originalBlocks.length, translatedBlocks.length);
  for (let i = 0; i < maxLen; i++) {
    const orig = originalBlocks[i];
    const trans = translatedBlocks[i];

    if (orig.type !== trans.type) {
      errors.push(
        `Block type mismatch at index ${i}: expected '${orig.type}', got '${trans.type}'.`
      );
      continue;
    }

    if (orig.type === 'cta' && trans.type === 'cta') {
      if (orig.attrs.url !== trans.attrs.url) {
        errors.push(
          `CTA URL mismatch at CTA #${orig.index}: expected '${orig.attrs.url}', got '${trans.attrs.url}'.`
        );
      }
      if (orig.attrs.action !== trans.attrs.action) {
        errors.push(
          `CTA action mismatch at CTA #${orig.index}: expected '${orig.attrs.action}', got '${trans.attrs.action}'.`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

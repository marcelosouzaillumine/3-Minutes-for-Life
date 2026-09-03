import { toBlob } from 'html-to-image';

interface CardContent {
  title: string;
  subtitle?: string | null;
}

const BG = '#1e2535';
const TITLE_COLOR = '#ffffff';
const SUBTITLE_COLOR = '#c8924a';
const FONT = "'Fraunces', 'Georgia', serif";

// Cache the embedded CSS so we only fetch once per session
let cachedFontCss: string | null = null;

async function fetchFrauncesCss(): Promise<string> {
  if (cachedFontCss !== null) return cachedFontCss;

  const cssUrl =
    'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,600&display=swap';

  let css: string;
  try {
    const res = await fetch(cssUrl);
    css = await res.text();
  } catch {
    cachedFontCss = '';
    return '';
  }

  // Extract unique woff2 URLs
  const urlMatches = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)];
  const fontUrls = [...new Set(urlMatches.map(m => m[1]))];

  // Fetch each font file and replace URL with base64 data URI
  let embedded = css;
  await Promise.all(
    fontUrls.map(async (url) => {
      try {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        // Safe base64 encoding for large buffers
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const b64 = btoa(binary);
        embedded = embedded.split(url).join(`data:font/woff2;base64,${b64}`);
      } catch {
        // keep original URL
      }
    })
  );

  cachedFontCss = embedded;
  return embedded;
}

function buildCardEl(
  content: CardContent,
  format: 'feed' | 'story',
  logoSrc: string
): HTMLDivElement {
  const isStory = format === 'story';
  const W = 540;
  const H = isStory ? 960 : 540;
  const vPad = isStory ? 56 : 40;
  const hPad = isStory ? 48 : 44;
  const logoH = isStory ? '72px' : '60px';
  const logoGap = isStory ? '72px' : '44px';
  const titleSize = isStory ? '60px' : '46px';
  const subSize = isStory ? '26px' : '21px';
  const titleGap = isStory ? '36px' : '22px';

  const root = document.createElement('div');
  Object.assign(root.style, {
    position: 'fixed',
    left: '-9999px',
    top: '0',
    width: `${W}px`,
    height: `${H}px`,
    background: BG,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxSizing: 'border-box',
    padding: `${vPad}px ${hPad}px`,
    overflow: 'hidden',
  });

  // Logo row
  const logoWrap = document.createElement('div');
  Object.assign(logoWrap.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: logoGap,
    flexShrink: '0',
  });
  const img = document.createElement('img');
  img.src = logoSrc;
  Object.assign(img.style, { height: logoH, width: 'auto' });
  logoWrap.appendChild(img);
  root.appendChild(logoWrap);

  // Center content
  const center = document.createElement('div');
  Object.assign(center.style, {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    width: '100%',
  });

  const titleEl = document.createElement('div');
  Object.assign(titleEl.style, {
    fontFamily: FONT,
    fontSize: titleSize,
    fontWeight: '700',
    color: TITLE_COLOR,
    lineHeight: '1.2',
    marginBottom: content.subtitle?.trim() ? titleGap : '0',
    letterSpacing: '-0.3px',
  });
  titleEl.textContent = content.title;
  center.appendChild(titleEl);

  if (content.subtitle?.trim()) {
    const subEl = document.createElement('div');
    Object.assign(subEl.style, {
      fontFamily: FONT,
      fontSize: subSize,
      fontStyle: 'italic',
      fontWeight: '600',
      color: SUBTITLE_COLOR,
      lineHeight: '1.55',
    });
    subEl.textContent = content.subtitle;
    center.appendChild(subEl);
  }

  root.appendChild(center);

  // Bottom spacer mirrors logo height for visual balance
  const spacer = document.createElement('div');
  spacer.style.height = logoH;
  spacer.style.flexShrink = '0';
  root.appendChild(spacer);

  return root;
}

export async function captureCardAsBlob(
  content: CardContent,
  format: 'feed' | 'story',
  logoSrc: string
): Promise<Blob> {
  const W = 540;
  const H = format === 'story' ? 960 : 540;

  // Fetch and embed Fraunces font as base64 so html-to-image
  // can inline it without cross-origin issues
  const fontEmbedCSS = await fetchFrauncesCss();

  const el = buildCardEl(content, format, logoSrc);
  document.body.appendChild(el);

  const options = {
    width: W,
    height: H,
    backgroundColor: BG,
    ...(fontEmbedCSS ? { fontEmbedCSS } : {}),
  };

  try {
    // Two warm-up passes so html-to-image caches resources
    await toBlob(el, { ...options, pixelRatio: 1 });
    await toBlob(el, { ...options, pixelRatio: 1 });

    const blob = await toBlob(el, { ...options, pixelRatio: 2 });
    if (!blob) throw new Error('Captura retornou vazio.');
    return blob;
  } finally {
    el.parentNode?.removeChild(el);
  }
}

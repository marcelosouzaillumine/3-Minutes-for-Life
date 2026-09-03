import { toBlob } from 'html-to-image';

interface CardContent {
  title: string;
  subtitle?: string | null;
}

const BG = '#1e2535';
const TITLE_COLOR = '#ffffff';
const SUBTITLE_COLOR = '#c8924a';
const FONT = "'Fraunces', 'Georgia', serif";

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

async function ensureFontLoaded(): Promise<void> {
  // Force Fraunces to load by rendering hidden text with it
  const probe = document.createElement('span');
  probe.textContent = 'Aa';
  Object.assign(probe.style, {
    fontFamily: "'Fraunces', serif",
    fontSize: '40px',
    fontWeight: '700',
    position: 'fixed',
    left: '-9999px',
    top: '0',
    visibility: 'hidden',
  });
  document.body.appendChild(probe);
  await document.fonts.load("700 40px 'Fraunces'");
  await document.fonts.load("italic 600 40px 'Fraunces'");
  await document.fonts.ready;
  probe.parentNode?.removeChild(probe);
  // Extra tick for paint
  await new Promise(r => setTimeout(r, 300));
}

export async function captureCardAsBlob(
  content: CardContent,
  format: 'feed' | 'story',
  logoSrc: string
): Promise<Blob> {
  const W = 540;
  const H = format === 'story' ? 960 : 540;

  await ensureFontLoaded();

  const el = buildCardEl(content, format, logoSrc);
  document.body.appendChild(el);

  try {
    // Three passes: first two prime font+image cache inside html-to-image
    await toBlob(el, { pixelRatio: 1, width: W, height: H });
    await toBlob(el, { pixelRatio: 1, width: W, height: H });

    const blob = await toBlob(el, { pixelRatio: 2, width: W, height: H });

    if (!blob) throw new Error('Captura retornou vazio.');
    return blob;
  } finally {
    el.parentNode?.removeChild(el);
  }
}

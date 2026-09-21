// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

// canWebShare é avaliado quando o módulo é importado, então navigator.share
// precisa existir antes dos imports abaixo.
vi.hoisted(() => {
  Object.defineProperty(navigator, 'share', { value: vi.fn(), configurable: true, writable: true });
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key, i18n: { language: 'pt-BR' } }),
}));
vi.mock('../createShareImage', () => ({
  createShareImage: vi.fn(async () => new Blob(['img'], { type: 'image/png' })),
}));
vi.mock('../../services/AnalyticsService', () => ({ AnalyticsService: { trackEvent: vi.fn() } }));
vi.mock('../../lib/illumine', () => ({ illumineFetch: vi.fn(async () => ({ ok: false })) }));

import { ShareImageMenu } from '../ShareImageMenu';
import { AnalyticsService } from '../../services/AnalyticsService';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const trackEvent = AnalyticsService.trackEvent as Mock;
const share = navigator.share as unknown as Mock;

describe('ShareImageMenu — registro de compartilhamento', () => {
  let container: HTMLDivElement;
  let root: Root;

  const click = async (el: Element | null | undefined) => {
    await act(async () => { (el as HTMLElement).click(); });
  };
  const byText = (text: string) =>
    [...container.ownerDocument.querySelectorAll('button')].find(b => b.textContent?.includes(text));

  // Abre o menu e escolhe o formato "WhatsApp"; retorna quando o fluxo async termina.
  const shareViaWhatsApp = async () => {
    await click(container.querySelector('button[aria-label="Compartilhar"]'));
    await click(byText('WhatsApp'));
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });
  };

  beforeEach(async () => {
    trackEvent.mockReset();
    share.mockReset();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    URL.createObjectURL = vi.fn(() => 'blob:teste');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(<ShareImageMenu devotionalId="dev-1" title="T" isDaily />); });
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('registra content_shared com o episódio quando o usuário conclui o compartilhamento', async () => {
    (navigator as any).canShare = vi.fn(() => true);
    share.mockResolvedValue(undefined);

    await shareViaWhatsApp();

    expect(share).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('content_shared', expect.objectContaining({
      devotional_id: 'dev-1',
      channel: 'og',
      is_daily: true,
      language: 'pt-BR',
    }));
  });

  it('compartilhar duas vezes registra duas vezes', async () => {
    (navigator as any).canShare = vi.fn(() => true);
    share.mockResolvedValue(undefined);

    await shareViaWhatsApp();
    await shareViaWhatsApp();

    expect(trackEvent).toHaveBeenCalledTimes(2);
  });

  it('não registra quando o usuário cancela o compartilhamento', async () => {
    (navigator as any).canShare = vi.fn(() => true);
    share.mockRejectedValue(new DOMException('cancelado', 'AbortError'));

    await shareViaWhatsApp();

    expect(share).toHaveBeenCalledTimes(1);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('não registra no fallback de download (não dá para saber se foi enviado)', async () => {
    (navigator as any).canShare = vi.fn(() => false);

    await shareViaWhatsApp();

    expect(share).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalled();
  });
});

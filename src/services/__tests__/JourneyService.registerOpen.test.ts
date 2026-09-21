import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/illumine', () => ({ illumineFetch: vi.fn() }));
vi.mock('../AnalyticsService', () => ({ AnalyticsService: { trackEvent: vi.fn() } }));

import { illumineFetch } from '../../lib/illumine';
import { AnalyticsService } from '../AnalyticsService';
import { JourneyService } from '../JourneyService';

const mockFetch = vi.mocked(illumineFetch);
const trackEvent = vi.mocked(AnalyticsService.trackEvent);

describe('JourneyService.registerOpen', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    trackEvent.mockReset();
    mockFetch.mockResolvedValue({ ok: true } as Response);
  });

  it('registra o evento de abertura E marca o episódio como lido', async () => {
    await JourneyService.registerOpen({ id: 'dev-1', title: 'T' }, 'library', 'pt-BR');

    expect(trackEvent).toHaveBeenCalledWith('devotional_opened', {
      devotional_id: 'dev-1',
      title: 'T',
      channel: 'library',
      language: 'pt-BR',
    });
    expect(mockFetch).toHaveBeenCalledWith('/devotionals/dev-1/read', { method: 'POST' });
  });

  it('usa a rota legada quando o episódio tem legacy_id', async () => {
    await JourneyService.registerOpen({ id: 'dev-1', legacy_id: 42 }, 'home', 'pt-BR');

    expect(mockFetch).toHaveBeenCalledWith('/devotionals/legacy/42/read', { method: 'POST' });
  });

  it('falha ao marcar como lido não quebra a abertura do episódio', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockRejectedValue(new Error('rede'));

    await expect(JourneyService.registerOpen({ id: 'dev-1' }, 'favorites', 'en')).resolves.toBeUndefined();
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });
});

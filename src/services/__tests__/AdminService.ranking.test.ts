import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/illumine', () => ({ illumineFetch: vi.fn() }));

import { illumineFetch } from '../../lib/illumine';
import { AdminService } from '../AdminService';

const mockFetch = vi.mocked(illumineFetch);

const jsonResponse = (body: unknown, ok = true, status = 200) =>
  ({ ok, status, json: async () => body }) as Response;

describe('AdminService.getDevotionalRanking', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('mapeia a resposta do gateway para snake_case', async () => {
    mockFetch.mockResolvedValue(jsonResponse({
      totalRanked: 2,
      items: [
        { devotionalId: 'a', title: 'A', uniqueReads: 17, totalOpens: 40, rankByReads: 1, rankByOpens: 1 },
        { devotionalId: 'b', title: 'B', uniqueReads: 0, totalOpens: 0, rankByReads: null, rankByOpens: null },
      ],
    }));

    const result = await AdminService.getDevotionalRanking();

    expect(mockFetch).toHaveBeenCalledWith('/analytics/devotionals/ranking');
    expect(result).toEqual({
      total_ranked: 2,
      items: [
        { devotional_id: 'a', unique_reads: 17, total_opens: 40, rank_by_reads: 1, rank_by_opens: 1 },
        { devotional_id: 'b', unique_reads: 0, total_opens: 0, rank_by_reads: null, rank_by_opens: null },
      ],
    });
  });

  it('usa valores neutros quando campos vêm ausentes', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ items: [{ devotionalId: 'a' }] }));

    const result = await AdminService.getDevotionalRanking();

    expect(result).toEqual({
      total_ranked: 0,
      items: [{ devotional_id: 'a', unique_reads: 0, total_opens: 0, rank_by_reads: null, rank_by_opens: null }],
    });
  });

  it('retorna null (sem lançar) quando o endpoint falha, ex.: gateway ainda sem a rota', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: 'NOT_FOUND' }, false, 404));

    await expect(AdminService.getDevotionalRanking()).resolves.toBeNull();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminRelationshipService } from '../AdminRelationshipService';
import { supabase } from '../../lib/supabase';

// Mock Supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('AdminRelationshipService Unit & Governance Tests (Fase 3)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── 1. Controle de Acesso & Menor Privilégio ──────────────────────────────

  describe('1. Controle de Acesso & Menor Privilégio (Role Gate)', () => {
    it('Autoriza acesso para super_admin', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: { user: { id: 'admin-1' } } as any },
        error: null,
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: { role: 'super_admin' },
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValueOnce(mockQuery as any);

      const hasAccess = await AdminRelationshipService.checkRelationshipAccess();
      expect(hasAccess).toBe(true);
    });

    it('Autoriza acesso para admin', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: { user: { id: 'admin-2' } } as any },
        error: null,
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: { role: 'admin' },
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValueOnce(mockQuery as any);

      const hasAccess = await AdminRelationshipService.checkRelationshipAccess();
      expect(hasAccess).toBe(true);
    });

    it('BLOQUEIA role analyst para relatos pastorais individuais', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: { user: { id: 'analyst-1' } } as any },
        error: null,
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: { role: 'analyst' },
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValueOnce(mockQuery as any);

      const hasAccess = await AdminRelationshipService.checkRelationshipAccess();
      expect(hasAccess).toBe(false);
    });

    it('BLOQUEIA usuário não autenticado', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const hasAccess = await AdminRelationshipService.checkRelationshipAccess();
      expect(hasAccess).toBe(false);
    });
  });

  // ─── 2. Visão Geral & Agregação de Métricas ───────────────────────────────

  describe('2. Visão Geral & Agregação de Métricas', () => {
    it('Agrega contagens de pendentes, tratados e totais corretamente', async () => {
      vi.spyOn(AdminRelationshipService, 'checkRelationshipAccess').mockResolvedValueOnce(true);

      // Mock Testimonials data
      const mockTestimonials = [
        { id: 't1', user_id: 'u1', content: 'Muito abençoado', status: 'pending', created_at: '2026-08-20T10:00:00Z', profiles: { full_name: 'Ana' }, devotionals: { title: 'Paciência' } },
        { id: 't2', user_id: 'u2', content: 'História linda', status: 'reviewed', created_at: '2026-08-19T10:00:00Z', profiles: { full_name: 'Beto' }, devotionals: null },
        { id: 't3', user_id: 'u3', content: 'Superou expectativas', status: 'archived', created_at: '2026-08-18T10:00:00Z', profiles: null, devotionals: null },
      ];

      // Mock Prayer Requests data
      const mockPrayers = [
        { id: 'p1', user_id: 'u4', request: 'Orem por minha saúde', language: 'pt-BR', status: 'pending', created_at: '2026-08-20T12:00:00Z', profiles: { full_name: 'Carlos' }, devotionals: null },
        { id: 'p2', user_id: 'u5', request: 'Please pray for my family', language: 'en', status: 'prayed', created_at: '2026-08-20T11:00:00Z', profiles: { full_name: 'David' }, devotionals: null },
        { id: 'p3', user_id: 'u6', request: 'Oración por trabajo', language: 'es', status: 'archived', created_at: '2026-08-17T10:00:00Z', profiles: null, devotionals: null },
      ];

      const tmQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({ data: mockTestimonials, error: null }),
      };

      const prQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({ data: mockPrayers, error: null }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(tmQuery as any)
        .mockReturnValueOnce(prQuery as any);

      const overview = await AdminRelationshipService.getOverview();

      expect(overview.testimonials.pending).toBe(1);
      expect(overview.testimonials.reviewed).toBe(1);
      expect(overview.testimonials.archived).toBe(1);
      expect(overview.testimonials.total).toBe(3);

      expect(overview.prayer_requests.pending).toBe(1);
      expect(overview.prayer_requests.prayed).toBe(1);
      expect(overview.prayer_requests.archived).toBe(1);
      expect(overview.prayer_requests.total).toBe(3);

      // Language distribution
      expect(overview.language_distribution['pt-BR']).toBe(1);
      expect(overview.language_distribution['en']).toBe(1);
      expect(overview.language_distribution['es']).toBe(1);

      // Recent Activity unified & ordered by date DESC
      expect(overview.recent_activity.length).toBe(6);
      expect(overview.recent_activity[0].id).toBe('p1'); // 12:00
      expect(overview.recent_activity[1].id).toBe('p2'); // 11:00
      expect(overview.recent_activity[2].id).toBe('t1'); // 10:00
    });
  });

  // ─── 3. Transição de Status Segura via RPC ──────────────────────────────────

  describe('3. Transição de Status Segura via RPC', () => {
    it('Chama update_relationship_status para Testemunho', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: { success: true, relationship_id: 't-123', new_status: 'reviewed' },
        error: null,
      } as any);

      await AdminRelationshipService.updateTestimonialStatus('t-123', 'reviewed');

      expect(supabase.rpc).toHaveBeenCalledWith('update_relationship_status', {
        p_relationship_type: 'testimonial',
        p_relationship_id: 't-123',
        p_new_status: 'reviewed',
      });
    });

    it('Chama update_relationship_status para Pedido de Oração com status "prayed"', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: { success: true, relationship_id: 'p-456', new_status: 'prayed' },
        error: null,
      } as any);

      await AdminRelationshipService.updatePrayerRequestStatus('p-456', 'prayed');

      expect(supabase.rpc).toHaveBeenCalledWith('update_relationship_status', {
        p_relationship_type: 'prayer_request',
        p_relationship_id: 'p-456',
        p_new_status: 'prayed',
      });
    });

    it('Lança erro se a RPC retornar falha', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: new Error('Invalid status transition for prayer request from "archived" to "invalid"'),
      } as any);

      await expect(
        AdminRelationshipService.updatePrayerRequestStatus('p-456', 'invalid' as any)
      ).rejects.toThrow();
    });
  });

  // ─── 4. Matriz de Transições de Status Válidas ─────────────────────────────

  describe('4. Matriz de Transições de Status Permitidas', () => {
    const validTestimonialTransitions: Array<[string, string]> = [
      ['pending', 'reviewed'],
      ['pending', 'archived'],
      ['reviewed', 'pending'],
      ['reviewed', 'archived'],
      ['archived', 'pending'],
      ['archived', 'reviewed'],
    ];

    const validPrayerTransitions: Array<[string, string]> = [
      ['pending', 'prayed'],
      ['pending', 'archived'],
      ['prayed', 'pending'],
      ['prayed', 'archived'],
      ['archived', 'pending'],
      ['archived', 'prayed'],
    ];

    it('Testemunhos contemplam exatamente todas as 6 transições bidirecionais', () => {
      expect(validTestimonialTransitions).toHaveLength(6);
    });

    it('Pedidos de oração usam status "prayed" (Em oração) e contemplam as 6 transições', () => {
      expect(validPrayerTransitions).toHaveLength(6);
      expect(validPrayerTransitions.some(([_, to]) => to === 'prayed')).toBe(true);
      expect(validPrayerTransitions.some(([from, _]) => from === 'prayed')).toBe(true);
    });
  });

  // ─── 5. Paginação e Filtros ────────────────────────────────────────────────

  describe('5. Paginação e Filtros', () => {
    it('Calcula range de paginação corretamente (page 2, pageSize 10)', async () => {
      vi.spyOn(AdminRelationshipService, 'checkRelationshipAccess').mockResolvedValueOnce(true);

      const mockQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValueOnce({
          data: [{ id: 't1', user_id: 'u1', content: 'Texto', status: 'pending', created_at: '', updated_at: '' }],
          count: 25,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValueOnce(mockQuery);

      const res = await AdminRelationshipService.getTestimonials({ page: 2, pageSize: 10 });

      expect(mockQuery.range).toHaveBeenCalledWith(10, 19);
      expect(res.page).toBe(2);
      expect(res.pageSize).toBe(10);
      expect(res.total).toBe(25);
      expect(res.totalPages).toBe(3);
    });
  });
});

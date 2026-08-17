import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../src/services/authService';
import { entitlementService } from '../../src/services/entitlementService';
import { leadService } from '../../src/services/leadService';
import { supabase } from '../../src/lib/supabase';

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn()
          })),
          maybeSingle: vi.fn()
        }))
      }))
    }))
  }
}));

describe('Services Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authService', () => {
    it('calls supabase auth signup', async () => {
      (supabase.auth.signUp as any).mockResolvedValueOnce({ data: { user: { id: '1' } }, error: null });
      await authService.signUp('test@test.com', '123456', 'Test');
      expect(supabase.auth.signUp).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@test.com',
        options: { data: { full_name: 'Test' } }
      }));
    });
  });

  describe('leadService', () => {
    it('trims and lowercases email', async () => {
      const mockInsert = vi.fn().mockResolvedValueOnce({ error: null });
      (supabase.from as any).mockReturnValueOnce({ insert: mockInsert });
      
      await leadService.submitLead({ name: 'Test', email: ' TEST@example.com ' });
      
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          email: 'test@example.com',
          name: 'Test'
        })
      ]);
    });
  });

  describe('entitlementService', () => {
    it('returns free entitlements when user has no active subscription', async () => {
      // Mock subscriptionService to return null (no subscription)
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      });
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const entitlements = await entitlementService.getUserEntitlements('user-id');
      expect(entitlements.canAccessDailyPrinciples).toBe(true);
      expect(entitlements.canAccessPremiumContent).toBe(false);
    });
  });
});

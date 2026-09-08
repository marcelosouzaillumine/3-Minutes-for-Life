import { supabase } from '../lib/supabase';
import { authService } from './authService';
import { illumineFetch, illumineAuth } from '../lib/illumine';

// Resolve legacyId (number) → UUID — usado apenas no fallback Supabase
const idCache = new Map<number, string>();

async function resolveDevotionalId(principleId: number): Promise<string | null> {
  if (idCache.has(principleId)) return idCache.get(principleId)!;
  const { data, error } = await supabase
    .from('devotionals')
    .select('id')
    .eq('legacy_id', principleId)
    .maybeSingle();
  if (error || !data) return null;
  idCache.set(principleId, data.id);
  return data.id;
}

export const JourneyService = {

  // ─── WRITES ──────────────────────────────────────────────────────────────────
  // Illumine OS é o primário quando o usuário tem sessão ativa.
  // Supabase entra como fallback para usuários ainda não migrados.

  async start(devotionalId: string, legacyId?: number) {
    if (legacyId && illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch(`/devotionals/legacy/${legacyId}/read`, { method: 'POST' });
        if (res.ok) return;
      } catch (e) {
        console.warn('[Journey] Illumine start failed, falling back to Supabase:', e);
      }
    }
    const session = await authService.getSession();
    const userId = session?.user?.id;
    if (!userId) return;
    await supabase
      .from('user_devotionals')
      .upsert(
        { user_id: userId, devotional_id: devotionalId, read_at: new Date().toISOString() },
        { onConflict: 'user_id, devotional_id', ignoreDuplicates: true }
      );
  },

  async complete(devotionalId: string, legacyId?: number) {
    if (legacyId && illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch(`/devotionals/legacy/${legacyId}/complete`, { method: 'POST' });
        if (res.ok) return;
      } catch (e) {
        console.warn('[Journey] Illumine complete failed, falling back to Supabase:', e);
      }
    }
    const session = await authService.getSession();
    const userId = session?.user?.id;
    if (!userId) return;
    await supabase
      .from('user_devotionals')
      .upsert(
        { user_id: userId, devotional_id: devotionalId, completed_at: new Date().toISOString() },
        { onConflict: 'user_id, devotional_id' }
      );
  },

  async toggleFavorite(devotionalId: string, legacyId?: number) {
    if (illumineAuth.isAuthenticated()) {
      try {
        const favRes = await illumineFetch('/devotionals/favorites');
        if (favRes.ok) {
          const favs = await favRes.json() as any[];
          const isFav = favs.some(f =>
            (f.devotional?.supabaseId ?? f.devotional?.id) === devotionalId ||
            f.devotionalId === devotionalId
          );
          const method = isFav ? 'DELETE' : 'POST';
          const path = legacyId
            ? `/devotionals/legacy/${legacyId}/favorite`
            : `/devotionals/${devotionalId}/favorite`;
          await illumineFetch(path, { method });
          return !isFav;
        }
      } catch (e) {
        console.warn('[Journey] Illumine toggleFavorite failed, falling back to Supabase:', e);
      }
    }
    const session = await authService.getSession();
    const userId = session?.user?.id;
    if (!userId) return false;
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('devotional_id', devotionalId)
      .eq('user_id', userId)
      .maybeSingle();
    const isFavorited = !!data;
    if (isFavorited) {
      await supabase.from('favorites').delete().eq('devotional_id', devotionalId).eq('user_id', userId);
    } else {
      await supabase.from('favorites').insert({ user_id: userId, devotional_id: devotionalId });
    }
    return !isFavorited;
  },

  // ─── READS ───────────────────────────────────────────────────────────────────
  // Illumine primeiro; Supabase como fallback em cascata.

  async getDevotionalId(principleId: number): Promise<string | null> {
    return resolveDevotionalId(principleId);
  },

  async getStatus(devotionalId: string, legacyId?: number, legacyDateStr?: string) {
    if (legacyId && illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch(`/devotionals/legacy/${legacyId}/status`);
        if (res.ok) {
          const d = await res.json();
          if (d.readAt || d.completedAt) return { started_at: d.readAt, completed_at: d.completedAt };
        }
      } catch (e) {
        console.warn('[Journey] Illumine getStatus failed, falling back:', e);
      }
    }
    const session = await authService.getSession();
    const userId = session?.user?.id;
    let query = supabase
      .from('user_devotionals')
      .select('read_at, completed_at')
      .eq('devotional_id', devotionalId);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.maybeSingle();
    if (!error && data) return { started_at: data.read_at, completed_at: data.completed_at };
    if (legacyId && legacyDateStr) {
      let legacyQuery = supabase
        .from('daily_progress')
        .select('started_at, completed_at')
        .eq('principle_id', legacyId)
        .eq('date', legacyDateStr);
      if (userId) legacyQuery = legacyQuery.eq('user_id', userId);
      const { data: legacyData } = await legacyQuery.maybeSingle();
      return legacyData;
    }
    return null;
  },

  async isFavorite(devotionalId: string, legacyId?: number) {
    const favIds = await this.listFavorites();
    if (favIds.includes(devotionalId)) return true;
    if (legacyId) {
      const session = await authService.getSession();
      const userId = session?.user?.id;
      if (!userId) return false;
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('principle_id', legacyId)
        .eq('user_id', userId)
        .maybeSingle();
      return !!data;
    }
    return false;
  },

  async listFavorites(): Promise<string[]> {
    if (illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch('/devotionals/favorites');
        if (res.ok) {
          const data = await res.json();
          const ids = (data as any[])
            .map(f => f.devotional?.supabaseId ?? f.devotional?.id)
            .filter(Boolean);
          if (ids.length > 0) return ids;
        }
      } catch (e) {
        console.warn('[Journey] Illumine listFavorites failed, falling back:', e);
      }
    }
    const session = await authService.getSession();
    const userId = session?.user?.id;
    if (!userId) return [];
    const { data, error } = await supabase
      .from('favorites')
      .select('devotional_id')
      .eq('user_id', userId)
      .not('devotional_id', 'is', null);
    if (error) throw error;
    return (data || []).map(f => f.devotional_id);
  },

  async listLegacyFavorites(): Promise<number[]> {
    const session = await authService.getSession();
    const userId = session?.user?.id;
    if (!userId) return [];
    const { data, error } = await supabase
      .from('favorites')
      .select('principle_id')
      .eq('user_id', userId)
      .not('principle_id', 'is', null);
    if (error) throw error;
    return (data || []).map(f => f.principle_id);
  },
};

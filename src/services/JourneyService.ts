import { supabase } from '../lib/supabase';
import { authService } from './authService';
import { illumineFetch, illumineAuth } from '../lib/illumine';

// FASE 2: Eliminar N+1 via Cache de Resolução
const idCache = new Map<number, string>();

async function resolveDevotionalId(principleId: number): Promise<string | null> {
  if (idCache.has(principleId)) {
    return idCache.get(principleId)!;
  }

  const { data, error } = await supabase
    .from('devotionals')
    .select('id')
    .eq('legacy_id', principleId)
    .maybeSingle();
  
  if (error || !data) return null;
  
  idCache.set(principleId, data.id);
  return data.id;
}

function illumineJourneyWrite(path: string, method: 'POST' | 'DELETE' = 'POST'): void {
  if (!illumineAuth.isAuthenticated()) return;
  illumineFetch(path, { method }).catch(e => console.warn('[Journey] Illumine write warning:', e));
}

export const JourneyService = {
  // --- CANONICAL WRITES (ZERO LEGACY WRITES) --- //

  async start(devotionalId: string, legacyId?: number) {
    const session = await authService.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    await supabase
      .from('user_devotionals')
      .upsert({
        user_id: userId,
        devotional_id: devotionalId,
        read_at: new Date().toISOString()
      }, { onConflict: 'user_id, devotional_id', ignoreDuplicates: true });

    if (legacyId) illumineJourneyWrite(`/devotionals/legacy/${legacyId}/read`);
  },

  async complete(devotionalId: string, legacyId?: number) {
    const session = await authService.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    const completedAt = new Date().toISOString();

    await supabase
      .from('user_devotionals')
      .upsert({
        user_id: userId,
        devotional_id: devotionalId,
        completed_at: completedAt
      }, { onConflict: 'user_id, devotional_id' });

    if (legacyId) illumineJourneyWrite(`/devotionals/legacy/${legacyId}/complete`);
  },

  async toggleFavorite(devotionalId: string, legacyId?: number) {
    const session = await authService.getSession();
    const userId = session?.user?.id;
    if (!userId) return false;

    // We check the new canonical column
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('devotional_id', devotionalId)
      .eq('user_id', userId)
      .maybeSingle();

    const isFavorited = !!data;

    if (isFavorited) {
      await supabase.from('favorites').delete().eq('devotional_id', devotionalId).eq('user_id', userId);
      if (legacyId) illumineJourneyWrite(`/devotionals/legacy/${legacyId}/favorite`, 'DELETE');
    } else {
      await supabase.from('favorites').insert({
        user_id: userId,
        devotional_id: devotionalId
      });
      if (legacyId) illumineJourneyWrite(`/devotionals/legacy/${legacyId}/favorite`);
    }

    return !isFavorited;
  },

  // --- TRANSITIONAL READ FALLBACKS --- //

  // Exposes the resolver so the UI can convert legacy ID to UUID once and use the Canonical Write methods
  async getDevotionalId(principleId: number): Promise<string | null> {
    return resolveDevotionalId(principleId);
  },

  async getStatus(devotionalId: string, legacyId?: number, legacyDateStr?: string) {
    const session = await authService.getSession();
    const userId = session?.user?.id;

    // 1. Canonical Read
    let query = supabase
      .from('user_devotionals')
      .select('read_at, completed_at')
      .eq('devotional_id', devotionalId);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.maybeSingle();
    
    if (!error && data) {
      return {
        started_at: data.read_at,
        completed_at: data.completed_at
      };
    }

    // 2. Legacy Read Fallback
    if (legacyId && legacyDateStr) {
      let legacyQuery = supabase
        .from('daily_progress')
        .select('started_at, completed_at')
        .eq('principle_id', legacyId)
        .eq('date', legacyDateStr);

      if (userId) {
        legacyQuery = legacyQuery.eq('user_id', userId);
      }

      const { data: legacyData } = await legacyQuery.maybeSingle();
      return legacyData;
    }
    
    return null;
  },

  async isFavorite(devotionalId: string, legacyId?: number) {
    const session = await authService.getSession();
    const userId = session?.user?.id;
    if (!userId) return false;

    // 1. Canonical Read
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('devotional_id', devotionalId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (data) return true;

    // 2. Legacy Read Fallback
    if (legacyId) {
      const { data: legacyData } = await supabase
        .from('favorites')
        .select('id')
        .eq('principle_id', legacyId)
        .eq('user_id', userId)
        .maybeSingle();
      return !!legacyData;
    }

    return false;
  },

  async listFavorites(): Promise<string[]> {
    const session = await authService.getSession();
    const userId = session?.user?.id;
    if (!userId) return [];

    const { data, error } = await supabase
      .from('favorites')
      .select('devotional_id')
      .eq('user_id', userId)
      .not('devotional_id', 'is', null);
      
    if (error) {
      console.error('Error listing favorites:', error);
      throw error;
    }
    
    return (data || []).map(f => f.devotional_id);
  },
  
  // Legacy method to help the UI until Gate 3 is done
  async listLegacyFavorites(): Promise<number[]> {
    const session = await authService.getSession();
    const userId = session?.user?.id;
    if (!userId) return [];

    const { data, error } = await supabase
      .from('favorites')
      .select('principle_id')
      .eq('user_id', userId)
      .not('principle_id', 'is', null);
      
    if (error) {
      console.error('Error listing legacy favorites:', error);
      throw error;
    }
    
    return (data || []).map(f => f.principle_id);
  }
};

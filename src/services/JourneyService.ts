import { supabase } from '../lib/supabase';

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

export const JourneyService = {
  // --- CANONICAL WRITES (ZERO LEGACY WRITES) --- //

  async start(devotionalId: string) {
    const userResp = await supabase.auth.getUser();
    const userId = userResp.data.user?.id;
    if (!userId) return;

    await supabase
      .from('user_devotionals')
      .upsert({ 
        user_id: userId,
        devotional_id: devotionalId,
        read_at: new Date().toISOString()
      }, { onConflict: 'user_id, devotional_id', ignoreDuplicates: true });
  },

  async complete(devotionalId: string) {
    const userResp = await supabase.auth.getUser();
    const userId = userResp.data.user?.id;
    if (!userId) return;

    const completedAt = new Date().toISOString();

    await supabase
      .from('user_devotionals')
      .upsert({ 
        user_id: userId,
        devotional_id: devotionalId,
        completed_at: completedAt
      }, { onConflict: 'user_id, devotional_id' });
  },
  
  async toggleFavorite(devotionalId: string) {
    const userResp = await supabase.auth.getUser();
    const userId = userResp.data.user?.id;
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
    } else {
      await supabase.from('favorites').insert({ 
        user_id: userId, 
        devotional_id: devotionalId
        // principle_id is left NULL for new favorites (or we can backfill it if the DB requires it, but the migration made it nullable)
      });
    }

    return !isFavorited;
  },

  // --- TRANSITIONAL READ FALLBACKS --- //

  // Exposes the resolver so the UI can convert legacy ID to UUID once and use the Canonical Write methods
  async getDevotionalId(principleId: number): Promise<string | null> {
    return resolveDevotionalId(principleId);
  },

  async getStatus(devotionalId: string, legacyId?: number, legacyDateStr?: string) {
    // 1. Canonical Read
    const { data, error } = await supabase
      .from('user_devotionals')
      .select('read_at, completed_at')
      .eq('devotional_id', devotionalId)
      .maybeSingle();
    
    if (!error && data) {
      return {
        started_at: data.read_at,
        completed_at: data.completed_at
      };
    }

    // 2. Legacy Read Fallback
    if (legacyId && legacyDateStr) {
      const { data: legacyData } = await supabase
        .from('daily_progress')
        .select('started_at, completed_at')
        .eq('principle_id', legacyId)
        .eq('date', legacyDateStr)
        .maybeSingle();
      
      return legacyData;
    }
    
    return null;
  },

  async isFavorite(devotionalId: string, legacyId?: number) {
    // 1. Canonical Read
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('devotional_id', devotionalId)
      .maybeSingle();
    
    if (data) return true;

    // 2. Legacy Read Fallback
    if (legacyId) {
      const { data: legacyData } = await supabase
        .from('favorites')
        .select('id')
        .eq('principle_id', legacyId)
        .maybeSingle();
      return !!legacyData;
    }

    return false;
  },

  async listFavorites(): Promise<string[]> {
    // Returns canonical devotional_ids
    const { data, error } = await supabase
      .from('favorites')
      .select('devotional_id')
      .not('devotional_id', 'is', null);
      
    if (error) {
      console.error('Error listing favorites:', error);
      throw error;
    }
    
    return data.map(f => f.devotional_id);
  },
  
  // Legacy method to help the UI until Gate 3 is done
  async listLegacyFavorites(): Promise<number[]> {
    const { data, error } = await supabase
      .from('favorites')
      .select('principle_id')
      .not('principle_id', 'is', null);
      
    if (error) {
      console.error('Error listing legacy favorites:', error);
      throw error;
    }
    
    return data.map(f => f.principle_id);
  }
};

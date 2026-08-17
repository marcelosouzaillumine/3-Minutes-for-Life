import { supabase } from '../lib/supabase';

// Helper to resolve the devotional_id (UUID) from the legacy principle_id
async function resolveDevotionalId(principleId: number): Promise<string | null> {
  const { data, error } = await supabase
    .from('devotionals')
    .select('id')
    .eq('legacy_id', principleId)
    .maybeSingle();
  
  if (error || !data) return null;
  return data.id;
}

export const JourneyService = {
  // Dual write for starting progress
  async start(principleId: number, dateStr: string) {
    const userResp = await supabase.auth.getUser();
    const userId = userResp.data.user?.id;
    if (!userId) return;

    // 1. Legacy Write
    await supabase
      .from('daily_progress')
      .upsert({ principle_id: principleId, date: dateStr }, { onConflict: 'user_id, principle_id, date', ignoreDuplicates: true });

    // 2. New Architecture Write
    const devotionalId = await resolveDevotionalId(principleId);
    if (devotionalId) {
      await supabase
        .from('user_devotionals')
        .upsert({ 
          user_id: userId,
          devotional_id: devotionalId,
          read_at: new Date().toISOString()
        }, { onConflict: 'user_id, devotional_id', ignoreDuplicates: true });
    }
  },

  // Dual write for completing progress
  async complete(principleId: number, dateStr: string) {
    const userResp = await supabase.auth.getUser();
    const userId = userResp.data.user?.id;
    if (!userId) return;

    const completedAt = new Date().toISOString();

    // 1. Legacy Write
    await supabase
      .from('daily_progress')
      .upsert({ principle_id: principleId, date: dateStr, completed_at: completedAt }, { onConflict: 'user_id, principle_id, date' });

    // 2. New Architecture Write
    const devotionalId = await resolveDevotionalId(principleId);
    if (devotionalId) {
      // First ensure it exists, then update completed_at
      await supabase
        .from('user_devotionals')
        .upsert({ 
          user_id: userId,
          devotional_id: devotionalId,
          completed_at: completedAt
        }, { onConflict: 'user_id, devotional_id' });
    }
  },
  
  // Dual read for status
  async getStatus(principleId: number, dateStr: string) {
    // We default to the new architecture if possible, fallback to legacy
    const devotionalId = await resolveDevotionalId(principleId);
    if (devotionalId) {
      const { data, error } = await supabase
        .from('user_devotionals')
        .select('read_at, completed_at')
        .eq('devotional_id', devotionalId)
        .maybeSingle();
      
      if (!error && data) {
        return {
          started_at: data.read_at, // mapped terminology
          completed_at: data.completed_at
        };
      }
    }

    // Fallback
    const { data } = await supabase
      .from('daily_progress')
      .select('started_at, completed_at')
      .eq('principle_id', principleId)
      .eq('date', dateStr)
      .maybeSingle();
      
    return data;
  },

  // Favorites Dual Toggle
  async toggleFavorite(principleId: number) {
    const userResp = await supabase.auth.getUser();
    const userId = userResp.data.user?.id;
    if (!userId) return false;

    // Check if it's currently favorited in the legacy table
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('principle_id', principleId)
      .maybeSingle();

    const isFavorited = !!data;
    const devotionalId = await resolveDevotionalId(principleId);

    if (isFavorited) {
      // Remove
      await supabase.from('favorites').delete().eq('principle_id', principleId).eq('user_id', userId);
    } else {
      // Add
      await supabase.from('favorites').insert({ 
        user_id: userId, 
        principle_id: principleId,
        devotional_id: devotionalId // New architecture backfill
      });
    }

    return !isFavorited;
  },

  async isFavorite(principleId: number) {
    // Prefer reading from new column if we knew the ID, but legacy is fine for Dual Read
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('principle_id', principleId)
      .maybeSingle();
    
    return !!data;
  },

  async listFavorites() {
    const { data, error } = await supabase
      .from('favorites')
      .select('principle_id');
      
    if (error) {
      console.error('Error listing favorites:', error);
      throw error;
    }
    
    return data.map(f => f.principle_id);
  }
};

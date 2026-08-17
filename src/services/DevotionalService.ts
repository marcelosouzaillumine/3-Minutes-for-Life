import { supabase } from '../lib/supabase';
import type { Devotional } from '../types/Devotional';
import { principles } from '../data/principles';

// --- TRANSITIONAL FALLBACK ADAPTER --- //
// Isolates legacy data from the canonical flow
function getTransitionalFallback(legacyId: number): Devotional {
  const legacyPrinciple = principles.find(p => p.id === legacyId) || principles[0];
  
  console.warn("TRANSITIONAL FALLBACK: Using principles.ts due to network/DB failure.");
  
  return {
    id: `fallback-${legacyPrinciple.id}`, // Fake UUID just to satisfy the type
    title: legacyPrinciple.title,
    reflection: legacyPrinciple.principle + "\\n\\n" + legacyPrinciple.reflection,
    practical_application: legacyPrinciple.application,
    scripture_reference: legacyPrinciple.reference?.citation,
    scripture_text: legacyPrinciple.reference?.text,
    audio_url: legacyPrinciple.audio?.url,
    share_quote: legacyPrinciple.principle // Add share_quote here too
  };
}

export const DevotionalService = {

  async getDailyDevotional(dateStr: string): Promise<Devotional> {
    // 1. LEGACY DETERMINISTIC RULE (To be replaced by publication_date)
    const date = new Date(dateStr);
    // Use UTC for consistent day calculations
    const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const totalLegacyPrinciples = 4; // Constant from MVP (only 4 seeded in DB currently)
    
    // In principles.ts, index is (dayOfYear % 31). So legacy_id is index + 1 (if IDs are 1-based)
    // Wait, let's replicate the EXACT logic from `daily.ts`:
    // const index = dayOfYear % principles.length; return principles[index];
    const index = dayOfYear % totalLegacyPrinciples;
    const legacyId = index + 1; // Assuming IDs are 1 to 31

    // 2. CANONICAL FETCH
    try {
      const { data, error } = await supabase
        .from('devotionals')
        .select(`
          id,
          title,
          reflection,
          practical_application,
          scripture_reference,
          scripture_text,
          audio_url,
          theme_id,
          category_id,
          categories (
            name
          )
        `)
        .eq('legacy_id', legacyId)
        .maybeSingle() as any;

      if (error) {
        throw error; // Do not mask real DB errors
      }
      
      if (!data) {
        throw new Error(`Content not found in Supabase for deterministic legacy_id ${legacyId}`);
      }

      const p = principles.find(p => p.title === data.title);
      data.share_quote = p?.principle || data.title;
      return data as Devotional;
    } catch (err) {
      // 3. TRANSITIONAL FALLBACK
      // Only runs if the canonical path strictly fails (e.g., offline)
      console.error("Canonical fetch failed:", err);
      return getTransitionalFallback(legacyId);
    }
  },

  async getDevotional(id: string): Promise<Devotional> {
    const { data, error } = await supabase
      .from('devotionals')
      .select(`
        id,
        title,
        reflection,
        practical_application,
        scripture_reference,
        scripture_text,
        audio_url,
        theme_id,
        category_id,
        categories (
          name
        )
      `)
      .eq('id', id)
      .single() as any;

    if (error) {throw error;}
    if (!data) throw new Error("Devotional not found");

    const p = principles.find(p => p.title === data.title);
    data.share_quote = p?.principle || data.title;
    return data as Devotional;
  },

  async getDevotionals(): Promise<Devotional[]> {
    const { data, error } = await supabase
      .from('devotionals')
      .select(`
        id,
        title,
        reflection,
        practical_application,
        scripture_reference,
        scripture_text,
        audio_url,
        theme_id,
        category_id,
        categories (
          name
        )
      `)
      // .eq('status', 'published') // Optional: if we implement status
      .order('legacy_id', { ascending: true }) as any; // Ordering by legacy for consistency during transition

    if (error) {throw error;}
    
    // In a real disaster where `data` is totally empty, we could map principles.ts,
    // but Explorer usually handles empty lists gracefully.
    return (data as any[]).map(d => {
      const p = principles.find(p => p.title === d.title);
      return { ...d, share_quote: p?.principle || d.title } as Devotional;
    });
  }
};

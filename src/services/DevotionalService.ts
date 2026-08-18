import { supabase } from '../lib/supabase';
import type { Devotional } from '../types/Devotional';
import { principles } from '../data/principles';
import { getTodayInSaoPaulo } from '../utils/date';

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
        .eq('publication_date', dateStr)
        .maybeSingle() as any;

      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error(`Content not found in Supabase for publication_date ${dateStr}`);
      }

      const p = principles.find(p => p.title === data.title);
      data.share_quote = p?.principle || data.title;
      return data as Devotional;
    } catch (err) {
      console.error("Canonical fetch failed:", err);
      return getTransitionalFallback(1); // Default fallback if offline
    }
  },

  async getDevotional(id: string): Promise<Devotional> {
    const today = getTodayInSaoPaulo();
    
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
      .lte('publication_date', today)
      .single() as any;

    if (error) {throw error;}
    if (!data) throw new Error("Devotional not found or not published yet");

    const p = principles.find(p => p.title === data.title);
    data.share_quote = p?.principle || data.title;
    return data as Devotional;
  },

  async getDevotionals(): Promise<Devotional[]> {
    const today = getTodayInSaoPaulo();
    
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
      .lte('publication_date', today)
      .order('publication_date', { ascending: true }) as any;

    if (error) {throw error;}
    
    return (data as any[]).map(d => {
      const p = principles.find(p => p.title === d.title);
      return { ...d, share_quote: p?.principle || d.title } as Devotional;
    });
  }
};

import { supabase } from '../lib/supabase';

export const progressService = {
  async start(principleId: number, dateStr: string) {
    // Upsert to mark as started
    const { error } = await supabase
      .from('daily_progress')
      .upsert({
        principle_id: principleId,
        date: dateStr,
      }, { onConflict: 'user_id, principle_id, date', ignoreDuplicates: true });

    if (error) {
      console.error('Error starting progress:', error);
    }
  },

  async complete(principleId: number, dateStr: string) {
    // Upsert and update completed_at
    const { error } = await supabase
      .from('daily_progress')
      .upsert({
        principle_id: principleId,
        date: dateStr,
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id, principle_id, date' });

    if (error) {
      console.error('Error completing progress:', error);
    }
  },
  
  async getStatus(principleId: number, dateStr: string) {
    const { data, error } = await supabase
      .from('daily_progress')
      .select('started_at, completed_at')
      .eq('principle_id', principleId)
      .eq('date', dateStr)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching progress status:', error);
      return null;
    }
    
    return data;
  }
};

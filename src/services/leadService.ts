import { supabase } from '../lib/supabase';

export interface LeadData {
  name: string;
  email: string;
  source?: string;
}

export const leadService = {
  async submitLead(data: LeadData) {
    const { error } = await supabase
      .from('leads')
      .insert([
        {
          name: data.name,
          email: data.email.toLowerCase().trim(),
          source: data.source || 'landing',
        }
      ]);

    if (error) {
      console.error('Error submitting lead:', error);
      throw new Error('Não foi possível registrar seu e-mail no momento. Tente novamente mais tarde.');
    }
    return { success: true };
  }
};

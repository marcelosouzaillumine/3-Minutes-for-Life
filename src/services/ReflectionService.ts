import { supabase } from '../lib/supabase';

export interface PersonalReflection {
  id: string;
  user_id: string;
  devotional_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalReflectionWithDevotional extends PersonalReflection {
  devotionals?: { title: string };
}

export const ReflectionService = {
  /**
   * Obtém a reflexão pessoal do usuário autenticado para um devocional específico.
   * Retorna o conteúdo da reflexão ou null se não existir.
   */
  async getReflection(devotionalId: string): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('personal_reflections')
        .select('content')
        .eq('devotional_id', devotionalId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.content || null;
    } catch (err) {
      console.error('Error fetching personal reflection:', err);
      return null;
    }
  },

  /**
   * Obtém todas as reflexões pessoais do usuário autenticado.
   */
  async getUserReflections(): Promise<PersonalReflectionWithDevotional[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('personal_reflections')
      .select('*, devotionals(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching personal reflections:', error);
      throw error;
    }
    return data as PersonalReflectionWithDevotional[];
  },

  /**
   * Salva (insere ou atualiza) a reflexão pessoal do usuário autenticado.
   */
  async saveReflection(devotionalId: string, content: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated to save a reflection');

    const { error } = await supabase
      .from('personal_reflections')
      .upsert({
        user_id: user.id,
        devotional_id: devotionalId,
        content: content
      }, {
        onConflict: 'user_id, devotional_id'
      });

    if (error) {
      console.error('Error saving personal reflection:', error);
      throw error;
    }
  },

  /**
   * Remove a reflexão pessoal do usuário para um devocional (se necessário futuramente).
   */
  async deleteReflection(devotionalId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated to delete a reflection');

    const { error } = await supabase
      .from('personal_reflections')
      .delete()
      .eq('devotional_id', devotionalId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting personal reflection:', error);
      throw error;
    }
  }
};

import { supabase } from '../lib/supabase';

export const favoritesService = {
  async add(principleId: number) {
    const { error } = await supabase
      .from('favorites')
      .insert([{ principle_id: principleId }]);
      
    if (error && error.code !== '23505') { // Ignore unique violation if already favorited
      console.error('Error adding favorite:', error);
      throw error;
    }
  },

  async remove(principleId: number) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('principle_id', principleId);
      
    if (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  },

  async list() {
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

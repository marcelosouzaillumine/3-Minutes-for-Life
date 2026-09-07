import { supabase } from '../lib/supabase';
import { authService } from './authService';
import { illumineFetch, illumineAuth } from '../lib/illumine';

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

function normalizeReflection(r: any): PersonalReflection {
  return {
    id: r.id,
    user_id: r.userId ?? r.user_id,
    devotional_id: r.devotionalId ?? r.devotional_id,
    content: r.content,
    created_at: r.createdAt ?? r.created_at,
    updated_at: r.updatedAt ?? r.updated_at,
  };
}

export const ReflectionService = {
  async getReflection(devotionalId: string): Promise<string | null> {
    if (illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch(`/users/me/reflections?devotionalId=${encodeURIComponent(devotionalId)}`);
        if (res.ok) {
          const rows: any[] = await res.json();
          if (rows.length > 0) return rows[0].content;
        }
      } catch (e) {
        console.warn('[Reflection] Illumine get failed, falling back:', e);
      }
    }

    const session = await authService.getSession();
    const userId = session?.user?.id;
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('personal_reflections')
        .select('content')
        .eq('devotional_id', devotionalId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data?.content || null;
    } catch (err) {
      console.error('Error fetching personal reflection:', err);
      return null;
    }
  },

  async getUserReflections(): Promise<PersonalReflectionWithDevotional[]> {
    if (illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch('/users/me/reflections');
        if (res.ok) {
          const rows: any[] = await res.json();
          return rows.map(normalizeReflection);
        }
      } catch (e) {
        console.warn('[Reflection] Illumine list failed, falling back:', e);
      }
    }

    const session = await authService.getSession();
    const userId = session?.user?.id;
    if (!userId) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('personal_reflections')
      .select('*, devotionals(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PersonalReflectionWithDevotional[];
  },

  async saveReflection(devotionalId: string, content: string): Promise<void> {
    if (illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch(`/users/me/reflections/${encodeURIComponent(devotionalId)}`, {
          method: 'PUT',
          body: JSON.stringify({ content }),
        });
        if (res.ok) return;
      } catch (e) {
        console.warn('[Reflection] Illumine save failed, falling back:', e);
      }
    }

    const session = await authService.getSession();
    const userId = session?.user?.id;
    if (!userId) throw new Error('User must be authenticated to save a reflection');

    const { error } = await supabase
      .from('personal_reflections')
      .upsert({ user_id: userId, devotional_id: devotionalId, content }, { onConflict: 'user_id, devotional_id' });

    if (error) throw error;
  },

  async deleteReflection(devotionalId: string): Promise<void> {
    if (illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch(`/users/me/reflections/${encodeURIComponent(devotionalId)}`, { method: 'DELETE' });
        if (res.ok || res.status === 204) return;
      } catch (e) {
        console.warn('[Reflection] Illumine delete failed, falling back:', e);
      }
    }

    const session = await authService.getSession();
    const userId = session?.user?.id;
    if (!userId) throw new Error('User must be authenticated to delete a reflection');

    const { error } = await supabase
      .from('personal_reflections')
      .delete()
      .eq('devotional_id', devotionalId)
      .eq('user_id', userId);

    if (error) throw error;
  }
};

import { createClient } from '@supabase/supabase-js';
import { illumineAuth } from './illumine';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables.');
}

export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321', 
  supabaseAnonKey || 'public-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: async (url, options = {}) => {
        const token = illumineAuth.getAccessToken();
        const headers = new Headers(options.headers || {});
        if (token && !headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
  }
);

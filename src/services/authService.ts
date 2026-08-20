import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { AnalyticsService } from './AnalyticsService';

export const authService = {
  async signUp(email: string, password: string, fullName: string, phone?: string, country?: string, state?: string, city?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
          country: country || null,
          state: state || null,
          city: city || null,
        }
      }
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signInWithOAuth(provider: 'google' | 'apple', redirectTo?: string) {
    const destination = redirectTo || '/app';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + destination
      }
    });
    if (error) throw error;

    // Note: OAuth redirects, so this event might not fire here. It's usually better to track it when the session is first established after redirect.
    // However, if it doesn't redirect immediately or returns data, we attempt to track.
    if (data && data.url) {
      // The actual auth event for OAuth usually happens via onAuthStateChange when the user returns.
    }

    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession(): Promise<Session | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // If we detect a new login via OAuth or generic SIGN_IN event that wasn't caught directly
      if (event === 'SIGNED_IN') {
        // To avoid duplicate tracking for password logins, we could rely strictly on SIGNED_IN here instead of the methods above,
        // but 'authentication_succeeded' should preferably have the method.
        // For OAuth, SIGNED_IN is the best place. We will fire a generic one if method is unknown.
        AnalyticsService.trackEvent('authentication_succeeded', { method: 'session_established', event });
      }
      callback(event, session);
    });
    return data.subscription;
  }
};

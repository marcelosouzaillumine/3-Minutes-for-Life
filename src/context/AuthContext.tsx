import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';
import i18n from '../i18n/config';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

const SUPPORTED_LANGUAGES = ['pt-BR', 'en', 'es'] as const;
type SupportedLang = typeof SUPPORTED_LANGUAGES[number];

/**
 * Após resolver uma sessão autenticada, lê o profile.preferred_language
 * e sincroniza com i18n. Isso é necessário para garantir que o Hero
 * renderize no idioma correto em qualquer cenário (reload, outro browser,
 * login via e-mail/OAuth) onde o localStorage esteja ausente ou desatualizado.
 *
 * Regra: o banco é a fonte canônica do idioma preferido do usuário.
 */
async function syncProfileLanguage(userId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('preferred_language')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return;

    const profileLang = data.preferred_language as string | null;
    if (!profileLang) return;

    // Normalize: 'en-US' → 'en', 'es-ES' → 'es', 'pt-BR' stays 'pt-BR'
    const normalized: SupportedLang = SUPPORTED_LANGUAGES.includes(profileLang as SupportedLang)
      ? (profileLang as SupportedLang)
      : (profileLang.startsWith('en') ? 'en' : profileLang.startsWith('es') ? 'es' : 'pt-BR');

    // Only call changeLanguage if it differs from the current i18n.language
    // to avoid triggering unnecessary re-renders and fetches
    if (i18n.language !== normalized) {
      await i18n.changeLanguage(normalized);
    }
  } catch {
    // Silent fail — language sync is non-critical; the user can select manually
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    authService.getSession().then(async (session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Sync preferred_language from profile before marking loading=false,
      // so that Home.tsx useEffect[i18n.language] fires with the correct language
      // on the very first render cycle.
      if (session?.user?.id) {
        await syncProfileLanguage(session.user.id);
      }

      setLoading(false);
    }).catch(err => {
      console.error('Failed to get session:', err);
      setLoading(false);
    });

    // Listen for auth changes (login/logout/OAuth callback)
    const subscription = authService.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Sync language on SIGNED_IN (covers OAuth callback and email login)
      if (session?.user?.id) {
        await syncProfileLanguage(session.user.id);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await authService.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


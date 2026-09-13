import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import i18n from '../i18n/config';

interface IllumineUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  preferred_language?: string;
}

interface IllumineSession {
  user: IllumineUser;
  accessToken: string | null;
}

interface AuthContextType {
  session: IllumineSession | null;
  user: IllumineUser | null;
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

function applyUserLanguage(user: IllumineUser): void {
  const profileLang = user.preferred_language;
  if (!profileLang) return;

  const normalized: SupportedLang = SUPPORTED_LANGUAGES.includes(profileLang as SupportedLang)
    ? (profileLang as SupportedLang)
    : (profileLang.startsWith('en') ? 'en' : profileLang.startsWith('es') ? 'es' : 'pt-BR');

  if (i18n.language !== normalized) {
    i18n.changeLanguage(normalized);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<IllumineSession | null>(null);
  const [user, setUser] = useState<IllumineUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .getSession()
      .then((currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          applyUserLanguage(currentSession.user);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to get session:', err);
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    const subscription = authService.onAuthStateChange((_event, currentSession) => {
      const current = currentSession as IllumineSession | null;
      setSession(current);
      setUser(current?.user ?? null);
      if (current?.user) {
        applyUserLanguage(current.user);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await authService.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

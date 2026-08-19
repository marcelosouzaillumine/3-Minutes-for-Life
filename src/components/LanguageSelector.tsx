import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';

interface LanguageSelectorProps {
  dropUp?: boolean;
}

export function LanguageSelector({ dropUp = false }: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const { session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const changeLanguage = async (lng: string) => {
    // 1. Atualiza UI Language
    i18n.changeLanguage(lng);
    setIsOpen(false);
    
    // 2. Persiste preferência
    if (session?.user) {
      await supabase
        .from('profiles')
        .update({ preferred_language: lng })
        .eq('id', session.user.id);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLangLabel = () => {
    if (i18n.language?.startsWith('en')) return 'EN';
    if (i18n.language?.startsWith('es')) return 'ES';
    return 'PT';
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          flexDirection: dropUp ? 'column' : 'row',
          alignItems: 'center',
          gap: '4px',
          padding: dropUp ? '0' : '6px 12px',
          fontSize: dropUp ? '0.75rem' : '0.9rem',
          border: 'none',
          background: 'transparent',
          color: 'currentColor',
          cursor: 'pointer',
          fontWeight: dropUp ? 400 : 500,
          transition: 'color 0.2s ease',
          opacity: 0.8
        }}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width={dropUp ? "24" : "18"} height={dropUp ? "24" : "18"}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <span>{getLangLabel()}</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          ...(dropUp ? { bottom: '100%', marginBottom: '8px' } : { top: '100%', marginTop: '8px' }),
          right: 0,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          zIndex: 100,
          minWidth: '120px'
        }}>
          {[
            { code: 'pt-BR', label: 'Português' },
            { code: 'en', label: 'English' },
            { code: 'es', label: 'Español' }
          ].map(lang => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 16px',
                border: 'none',
                background: (i18n.language === lang.code || (lang.code === 'pt-BR' && i18n.language === 'pt')) ? 'var(--color-bg-secondary)' : 'transparent',
                color: 'var(--color-text)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: (i18n.language === lang.code || (lang.code === 'pt-BR' && i18n.language === 'pt')) ? 600 : 400
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

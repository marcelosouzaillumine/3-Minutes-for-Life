import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptBRCommon from './locales/pt-BR/common.json';
import ptBRAuth from './locales/pt-BR/auth.json';
import ptBRLibrary from './locales/pt-BR/library.json';
import ptBRProfile from './locales/pt-BR/profile.json';
import ptBRContribution from './locales/pt-BR/contribution.json';
import ptBRMission from './locales/pt-BR/mission.json';
import ptBRLanding from './locales/pt-BR/landing.json';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enLibrary from './locales/en/library.json';
import enProfile from './locales/en/profile.json';
import enContribution from './locales/en/contribution.json';
import enMission from './locales/en/mission.json';
import enLanding from './locales/en/landing.json';

import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esLibrary from './locales/es/library.json';
import esProfile from './locales/es/profile.json';
import esContribution from './locales/es/contribution.json';
import esMission from './locales/es/mission.json';
import esLanding from './locales/es/landing.json';

export const defaultNS = 'common';

// Initialize i18next
i18n
  // Detect user language using browser or localStorage
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': {
        common: ptBRCommon,
        auth: ptBRAuth,
        library: ptBRLibrary,
        profile: ptBRProfile,
        contribution: ptBRContribution,
        mission: ptBRMission,
        landing: ptBRLanding
      },
      'en': {
        common: enCommon,
        auth: enAuth,
        library: enLibrary,
        profile: enProfile,
        contribution: enContribution,
        mission: enMission,
        landing: enLanding
      },
      'es': {
        common: esCommon,
        auth: esAuth,
        library: esLibrary,
        profile: esProfile,
        contribution: esContribution,
        mission: esMission,
        landing: esLanding
      }
    },
    defaultNS,
    fallbackLng: 'pt-BR',
    
    // Whitelist supported languages
    supportedLngs: ['pt-BR', 'en', 'es'],
    
    // Language detection configuration
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    },
    
    interpolation: {
      escapeValue: false // React already escapes values to prevent XSS
    }
  });

export default i18n;

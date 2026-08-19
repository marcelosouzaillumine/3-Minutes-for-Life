function resolveTranslation(
  devotional, 
  requestedLanguage,
  source = 'supabase',
  isCached = false
) {
  const translations = devotional.devotional_translations || [];
  
  if (requestedLanguage !== 'pt-BR') {
    const requestedTranslation = translations.find(
      t => t.language === requestedLanguage && 
           t.status === 'published' && 
           t.source_content_hash === devotional.content_hash
    );

    if (requestedTranslation) {
      return {
        ...devotional,
        title: requestedTranslation.title,
        subtitle: requestedTranslation.subtitle || devotional.subtitle,
        principle_statement: requestedTranslation.principle_statement || devotional.principle_statement,
        reflection: requestedTranslation.reflection,
        practical_application: requestedTranslation.practical_application || devotional.practical_application,
        prayer: requestedTranslation.prayer || devotional.prayer,
        requestedLanguage,
        resolvedLanguage: requestedLanguage,
        isLanguageFallback: false,
        isCached,
        source,
        devotional_translations: undefined
      };
    }
  }

  return {
    ...devotional,
    requestedLanguage,
    resolvedLanguage: 'pt-BR',
    isLanguageFallback: requestedLanguage !== 'pt-BR',
    isCached,
    source,
    devotional_translations: undefined
  };
}

const devotional = {
  "id": "a7d17d8c-dac2-4e01-a371-860d3c2f0384",
  "title": "Você está dando atenção ao que importa?",
  "reflection": "Test reflection PT",
  "devotional_translations": [
    {
      "id": "dd113350-73a5-4314-9ce6-9709618880e0",
      "status": "published",
      "language": "en",
      "title": "Are you paying attention to what matters?",
      "reflection": "Test reflection EN"
    }
  ]
};

console.log(resolveTranslation(devotional, 'en'));

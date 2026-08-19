import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
const client = createClient(process.env.VITE_SUPABASE_URL as string, process.env.VITE_SUPABASE_ANON_KEY as string);

function resolveTranslation(
  devotional: any, 
  requestedLanguage: string,
  source: 'supabase' | 'indexeddb' | 'legacy' = 'supabase',
  isCached: boolean = false
) {
  const translations = devotional.devotional_translations || [];
  
  let targetLang = requestedLanguage;
  if (requestedLanguage !== 'pt-BR' && requestedLanguage.includes('-')) {
    targetLang = requestedLanguage.split('-')[0];
  }

  if (targetLang !== 'pt-BR') {
    const requestedTranslation = translations.find(
      (t: any) => t.language === targetLang && 
           t.status === 'published' && 
           (!t.source_content_hash || t.source_content_hash === devotional.content_hash)
    );

    if (requestedTranslation) {
      return {
        ...devotional,
        title: requestedTranslation.title,
        subtitle: requestedTranslation.subtitle || devotional.subtitle,
        principle_statement: requestedTranslation.principle_statement || devotional.principle_statement,
        reflection: requestedTranslation.reflection,
        practical_application: requestedTranslation.practical_application,
        prayer: requestedTranslation.prayer || devotional.prayer,
        devotional_translations: [],
      };
    }
  }
  
  return { ...devotional, devotional_translations: [] };
}

async function run() {
  const selectQuery = `
  id,
  title,
  subtitle,
  principle_statement,
  reflection,
  practical_application,
  prayer,
  scripture_reference,
  scripture_text,
  audio_url,
  theme_id,
  category_id,
  content_hash,
  categories (
    name
  ),
  devotional_translations (
    id,
    language,
    title,
    subtitle,
    principle_statement,
    reflection,
    practical_application,
    prayer,
    status,
    source_content_hash
  )
`;

  const { data, error } = await client
    .from('devotionals')
    .select(selectQuery)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  console.log("=== ORIGINAL ===");
  console.log(data.title);

  console.log("\n=== RESOLVED TO EN ===");
  const resolvedEn = resolveTranslation(data, 'en');
  console.log(resolvedEn.title);

  console.log("\n=== RESOLVED TO ES ===");
  const resolvedEs = resolveTranslation(data, 'es');
  console.log(resolvedEs.title);
}

run().catch(console.error);

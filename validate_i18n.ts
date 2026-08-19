import { DevotionalService } from './src/services/DevotionalService';
import { getTodayInSaoPaulo } from './src/utils/date';
import { supabase } from './src/lib/supabase';

async function runValidation() {
  console.log("== STARTING I18N VALIDATION ==");
  let failed = 0;
  
  // 1. Devocional do dia consistency
  console.log("\\n--- Test 1: Devocional do dia ID consistency ---");
  const today = getTodayInSaoPaulo();
  const ptBR = await DevotionalService.getDailyDevotional(today, 'pt-BR');
  const en = await DevotionalService.getDailyDevotional(today, 'en');
  const es = await DevotionalService.getDailyDevotional(today, 'es');
  
  if (ptBR.id === en.id && en.id === es.id) {
    console.log("PASS: Canonical ID remains the same across languages:", ptBR.id);
  } else {
    console.log("FAIL: Canonical IDs differ!", { ptBR: ptBR.id, en: en.id, es: es.id });
    failed++;
  }
  
  // 2. Fallback Verification
  console.log("\\n--- Test 2: Fallback logic ---");
  // Assuming 'en' and 'es' might not be fully seeded except maybe 1 or 2.
  // The seed data has NO 'en' or 'es' rows since we only seeded 'pt-BR' translations.
  // So 'en' and 'es' should BOTH fallback to 'pt-BR'.
  if (en.isFallback === true && en.requestedLanguage === 'en' && en.resolvedLanguage === 'pt-BR') {
    console.log("PASS: 'en' request properly triggered fallback to 'pt-BR'");
  } else {
    console.log("FAIL: 'en' fallback failed", { isFallback: en.isFallback, requested: en.requestedLanguage, resolved: en.resolvedLanguage });
    failed++;
  }
  
  // 3. Translations table
  console.log("\\n--- Test 3: devotional_translations & RLS ---");
  const { data: trans, error } = await supabase.from('devotional_translations').select('id').limit(1);
  if (error) {
    console.log("FAIL: Could not query devotional_translations:", error.message);
    failed++;
  } else {
    console.log("PASS: Queried devotional_translations successfully.", trans);
  }

  // 4. Persistence / Profile verification
  console.log("\\n--- Test 4: Profile language preference ---");
  // Check if profile table has preferred_language column
  const { data: profs, error: profErr } = await supabase.from('profiles').select('preferred_language').limit(1);
  if (profErr) {
    console.log("FAIL: Could not query profiles.preferred_language:", profErr.message);
    failed++;
  } else {
    console.log("PASS: profiles table has preferred_language column.");
  }
  
  console.log("\\n== VALIDATION COMPLETE ==");
  if (failed === 0) {
    console.log("ALL TESTS PASSED.");
    process.exit(0);
  } else {
    console.log(`${failed} TESTS FAILED.`);
    process.exit(1);
  }
}

runValidation().catch(err => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});

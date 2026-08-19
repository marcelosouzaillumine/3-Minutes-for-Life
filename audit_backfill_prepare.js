import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
  console.log("=== GERANDO CONTADOR DE RECONCILIAÇÃO ===");

  const { data: languages, error: langErr } = await supabase
    .from('languages')
    .select('*')
    .eq('is_active', true)
    .eq('auto_translate', true)
    .eq('is_source', false);
    
  if (langErr) { console.error(langErr); return; }

  const { data: devotionals, error: devErr } = await supabase
    .from('devotionals')
    .select('id, publication_date, title')
    .eq('status', 'published');

  if (devErr) { console.error(devErr); return; }

  let totalPublishedWithoutEN = 0;
  let totalPublishedWithoutES = 0;
  let totalMissing = 0;
  let candidates = [];

  for (const dev of devotionals) {
    const { data: translations } = await supabase
      .from('devotional_translations')
      .select('language, status')
      .eq('devotional_id', dev.id);

    const { data: jobs } = await supabase
      .from('translation_jobs')
      .select('target_language, status')
      .eq('devotional_id', dev.id);

    let hasEN = false, hasES = false;

    for (const lang of languages) {
      const iso = lang.iso_code;
      const trans = translations?.find(t => t.language === iso && t.status === 'published');
      const job = jobs?.find(j => j.target_language === iso && ['queued', 'translating'].includes(j.status));

      if (!trans && !job) {
        totalMissing++;
        if (iso === 'en') { totalPublishedWithoutEN++; hasEN = false; }
        if (iso === 'es') { totalPublishedWithoutES++; hasES = false; }
        candidates.push({
          devotional_id: dev.id,
          date: dev.publication_date,
          target_language: iso,
          has_translation: !!translations?.find(t => t.language === iso),
          translation_status: translations?.find(t => t.language === iso)?.status || 'none',
          has_job: !!jobs?.find(j => j.target_language === iso),
          job_status: jobs?.find(j => j.target_language === iso)?.status || 'none'
        });
      }
    }
  }

  console.log(`- total de devocionais publicados sem EN: ${totalPublishedWithoutEN}`);
  console.log(`- total de devocionais publicados sem ES: ${totalPublishedWithoutES}`);
  console.log(`- total geral de traduções faltantes candidatos: ${totalMissing}`);
  
  const { count: queuedCount } = await supabase.from('translation_jobs').select('*', { count: 'exact', head: true }).eq('status', 'queued');
  const { count: translatingCount } = await supabase.from('translation_jobs').select('*', { count: 'exact', head: true }).eq('status', 'translating');
  const { count: transCount } = await supabase.from('devotional_translations').select('*', { count: 'exact', head: true }).eq('status', 'published');
  
  console.log(`- total de jobs queued existentes: ${queuedCount}`);
  console.log(`- total de jobs translating existentes: ${translatingCount}`);
  console.log(`- total de traduções published existentes: ${transCount}`);
  
  console.log("\n--- AMOSTRA DE CANDIDATOS (Top 5) ---");
  console.log(candidates.slice(0, 5));
}
audit();

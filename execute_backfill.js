import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// Using REST since we are just doing simple inserts and selects
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== INICIANDO BACKFILL ===");

  const devotionalId = '55772fdb-db88-4ba2-a539-3c745d24e64d';

  // 1. Verify devotional exists and is published
  const { data: dev } = await supabase.from('devotionals').select('id, status').eq('id', devotionalId).single();
  if (!dev || dev.status !== 'published') {
    console.log("Devocional não encontrado ou não publicado.");
    return;
  }

  // 2. Fetch target languages
  const { data: languages } = await supabase.from('languages').select('iso_code').eq('is_active', true).eq('auto_translate', true).eq('is_source', false);
  
  const jobsCreated = [];

  // 3. For each language check translations and jobs
  for (const lang of languages) {
    const { data: translations } = await supabase.from('devotional_translations').select('id').eq('devotional_id', devotionalId).eq('language', lang.iso_code).eq('status', 'published');
    const { data: jobs } = await supabase.from('translation_jobs').select('id, status').eq('devotional_id', devotionalId).eq('target_language', lang.iso_code).in('status', ['queued', 'translating']);

    if ((!translations || translations.length === 0) && (!jobs || jobs.length === 0)) {
      console.log(`Candidato verificado: ${devotionalId} -> ${lang.iso_code}`);
      
      // INSERT job
      const { data: insertedJob, error } = await supabase.from('translation_jobs').insert({
        devotional_id: devotionalId,
        source_language: 'pt-BR',
        target_language: lang.iso_code,
        status: 'queued'
      }).select().single();

      if (error) {
        console.error("Erro ao inserir job", error);
      } else {
        console.log(`Job inserido: ${insertedJob.id} -> ${insertedJob.target_language}`);
        jobsCreated.push(insertedJob.id);
      }
    } else {
      console.log(`Job ou tradução já existe para ${lang.iso_code}. Ignorando.`);
    }
  }

  if (jobsCreated.length > 0) {
    console.log("\nAguardando 15 segundos para a Edge Function processar...");
    await new Promise(r => setTimeout(r, 15000));
    
    console.log("\n=== AUDITORIA POS-PROCESSAMENTO ===");
    
    // Check jobs
    for (const jobId of jobsCreated) {
      const { data: job } = await supabase.from('translation_jobs').select('id, status, error_message, target_language').eq('id', jobId).single();
      console.log(`\nJob ${jobId} (${job.target_language}): status = ${job.status}, error = ${job.error_message || 'null'}`);
      
      // Check translation
      const { data: trans } = await supabase.from('devotional_translations').select('status, title, reflection, principle_statement, prayer').eq('devotional_id', devotionalId).eq('language', job.target_language).single();
      if (trans) {
        console.log(`Tradução ${job.target_language}: status = ${trans.status}`);
        console.log(` - title: ${!!trans.title}`);
        console.log(` - reflection: ${!!trans.reflection}`);
        console.log(` - principle_statement: ${!!trans.principle_statement}`);
        console.log(` - prayer: ${trans.prayer === null ? 'null (aceito)' : 'preenchido'}`);
      } else {
        console.log(`Tradução ${job.target_language}: NÃO ENCONTRADA`);
      }
    }
  } else {
    console.log("Nenhum job inserido.");
  }
}

run();

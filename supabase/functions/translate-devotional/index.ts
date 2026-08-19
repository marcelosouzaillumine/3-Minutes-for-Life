import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

// Configuration via Env Vars
const TRANSLATION_BATCH_SIZE = parseInt(Deno.env.get('TRANSLATION_BATCH_SIZE') || '5', 10);
const TRANSLATION_MAX_RETRIES = parseInt(Deno.env.get('TRANSLATION_MAX_RETRIES') || '3', 10);
const TRANSLATION_PROVIDER = Deno.env.get('TRANSLATION_PROVIDER') || 'openai';
const TRANSLATION_MODEL = Deno.env.get('TRANSLATION_MODEL') || 'gpt-4o-mini';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const workerId = `worker-${crypto.randomUUID()}`;

const openaiConfig = new Configuration({ apiKey: OPENAI_API_KEY });
const openai = new OpenAIApi(openaiConfig);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getGlossary(sourceLang: string, targetLang: string) {
  const { data } = await supabase
    .from('translation_glossary')
    .select('source_term, target_term')
    .eq('source_language', sourceLang)
    .eq('target_language', targetLang);
  
  if (!data || data.length === 0) return '';
  return "Glossário Editorial (Sempre use estas traduções para estes termos):\n" + 
    data.map(g => `- "${g.source_term}" -> "${g.target_term}"`).join('\n');
}

async function callOpenAI(devotional: any, targetLang: string, glossaryContext: string) {
  const prompt = `
  Traduza este conteúdo devocional do Português (Brasil) para o idioma de código ISO "${targetLang}".
  
  REGRAS EDITORIAIS:
  1. A tradução deve ser natural, contemporânea e com tom pastoral e acolhedor.
  2. Preservar o sentido teológico e referências bíblicas.
  3. Não adicione ideias inexistentes e não remova conceitos importantes.
  
  REGRAS ESTRUTURAIS:
  1. Você DEVE devolver a tradução como um JSON estrito.
  2. Preserve TODAS as tags HTML exatas do conteúdo (como <p>, <strong>, <em>).
  3. Não traduza nomes de classes ou atributos de HTML.
  
  ${glossaryContext}
  
  CONTEÚDO ORIGINAL:
  Title: ${devotional.title}
  Subtitle: ${devotional.subtitle}
  Principle Statement: ${devotional.principle_statement}
  Reflection:
  ${devotional.reflection}
  
  Practical Application:
  ${devotional.practical_application}
  
  Prayer:
  ${devotional.prayer}
  `;

  const response = await openai.createChatCompletion({
    model: TRANSLATION_MODEL,
    messages: [
      { role: "system", content: "Você é um tradutor teológico profissional especializado em devocionais cristãos. Retorne apenas JSON válido contendo as chaves: title, subtitle, principle_statement, reflection, practical_application, prayer." },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
  });

  const content = response.data.choices[0].message?.content || '{}';
  // Attempt to parse JSON from Markdown block if present
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/```json\n/, '').replace(/\n```$/, '');
  
  return JSON.parse(jsonStr);
}

function validateTranslation(original: any, translated: any) {
  const warnings = [];
  let isPass = true;
  
  const requiredFields = ['title', 'subtitle', 'principle_statement', 'reflection', 'practical_application', 'prayer'];
  for (const field of requiredFields) {
    if (!translated[field] || translated[field].trim() === '') {
      throw new Error(`Missing required field in translation: ${field}`);
    }
  }

  // Check significant length differences (Warning only)
  const origLength = original.reflection?.length || 0;
  const transLength = translated.reflection?.length || 0;
  if (origLength > 0 && (transLength < origLength * 0.5 || transLength > origLength * 1.5)) {
    warnings.push("Significant length variation in reflection");
  }

  return { pass: warnings.length === 0, warnings };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Claim Jobs Atomically
    const { data: jobs, error: claimError } = await supabase.rpc('claim_translation_jobs', {
      p_worker_id: workerId,
      p_limit: TRANSLATION_BATCH_SIZE
    });

    if (claimError) throw claimError;
    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: "No queued jobs found." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];

    for (const job of jobs) {
      let attemptStatus = 'success';
      let errorDetails = null;

      try {
        // Fetch original devotional
        const { data: devotional } = await supabase
          .from('devotionals')
          .select('*')
          .eq('id', job.devotional_id)
          .single();

        if (!devotional) throw new Error("Original devotional not found.");

        const glossaryContext = await getGlossary(job.source_language, job.target_language);
        
        // Translate via Provider
        let translatedData;
        if (TRANSLATION_PROVIDER === 'openai') {
          translatedData = await callOpenAI(devotional, job.target_language, glossaryContext);
        } else {
          throw new Error(`Unsupported provider: ${TRANSLATION_PROVIDER}`);
        }

        // Validate
        const validation = validateTranslation(devotional, translatedData);

        // Upsert Translation
        const { error: upsertError } = await supabase
          .from('devotional_translations')
          .upsert({
            devotional_id: job.devotional_id,
            language: job.target_language,
            title: translatedData.title,
            subtitle: translatedData.subtitle,
            principle_statement: translatedData.principle_statement,
            reflection: translatedData.reflection,
            practical_application: translatedData.practical_application,
            prayer: translatedData.prayer,
            source_content_hash: devotional.content_hash,
            status: validation.pass ? 'published' : 'draft',
            validation_warnings: validation.warnings.length > 0 ? validation.warnings : null
          }, { onConflict: 'devotional_id,language' });

        if (upsertError) throw upsertError;

        // Mark job as completed
        await supabase
          .from('translation_jobs')
          .update({ status: 'completed', error_message: null, warning_details: validation.warnings.length > 0 ? validation.warnings : null, updated_at: new Date().toISOString() })
          .eq('id', job.id);

        results.push({ job_id: job.id, status: 'completed' });

      } catch (err: any) {
        attemptStatus = 'error';
        errorDetails = err.message;

        // Determine if we should fail the job or requeue
        const newStatus = job.attempts >= TRANSLATION_MAX_RETRIES ? 'failed' : 'queued';
        
        await supabase
          .from('translation_jobs')
          .update({ status: newStatus, error_message: err.message, updated_at: new Date().toISOString() })
          .eq('id', job.id);

        results.push({ job_id: job.id, status: newStatus, error: err.message });
      }

      // Record Attempt History
      await supabase.from('translation_job_attempts').insert({
        job_id: job.id,
        attempt_number: job.attempts,
        status: attemptStatus,
        error_details: errorDetails,
        provider: TRANSLATION_PROVIDER,
        model: TRANSLATION_MODEL
      });
    }

    return new Response(JSON.stringify({ processed: jobs.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// @ts-nocheck
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.27.3";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';

const TRANSLATION_BATCH_SIZE = parseInt(Deno.env.get('TRANSLATION_BATCH_SIZE') || '5', 10);
const TRANSLATION_MAX_RETRIES = parseInt(Deno.env.get('TRANSLATION_MAX_RETRIES') || '3', 10);
const TRANSLATION_MODEL = Deno.env.get('TRANSLATION_MODEL') || 'claude-haiku-4-5-20251001';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const workerId = `worker-${crypto.randomUUID()}`;

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
    data.map((g: any) => `- "${g.source_term}" -> "${g.target_term}"`).join('\n');
}

async function callClaude(devotional: any, targetLang: string, glossaryContext: string) {
  const prompt = `Traduza este conteúdo devocional do Português (Brasil) para o idioma de código ISO "${targetLang}".

REGRAS EDITORIAIS:
1. A tradução deve ser natural, contemporânea e com tom pastoral e acolhedor.
2. Preservar o sentido teológico e referências bíblicas.
3. Não adicione ideias inexistentes e não remova conceitos importantes.

REGRAS ESTRUTURAIS:
1. Você DEVE devolver a tradução como um JSON estrito com as chaves: title, principle_statement, scripture_reference, scripture_text, reflection, practical_application, prayer.
2. Preserve TODAS as tags HTML exatas do conteúdo (como <p>, <strong>, <em>, <u>, <h2>, <h3>, <blockquote>).
3. Não traduza nomes de classes ou atributos de HTML técnicos.
4. Se houver blocos estruturais de CTA no formato <div data-type="cta" data-title="..." data-description="..." data-label="..." data-url="..." data-action="..."></div>:
   - Preserve a tag <div> e sua posição exata dentro do texto.
   - Traduza apenas os valores de data-title, data-description e data-label.
   - NUNCA altere ou traduza os valores de data-type, data-url e data-action.
   - NUNCA remova, recrie ou reposicione o bloco de CTA.

${glossaryContext}

CONTEÚDO ORIGINAL:
Title: ${devotional.title}
Principle Statement: ${devotional.principle_statement || ''}
Scripture Reference: ${devotional.scripture_reference || ''}
Scripture Text: ${devotional.scripture_text || ''}
Reflection:
${devotional.reflection || ''}

Practical Application:
${devotional.practical_application || ''}

Prayer:
${devotional.prayer || ''}`;

  const message = await anthropic.messages.create({
    model: TRANSLATION_MODEL,
    max_tokens: 4096,
    system: "Você é um tradutor teológico profissional especializado em devocionais cristãos. Retorne apenas JSON válido contendo as chaves: title, principle_statement, scripture_reference, scripture_text, reflection, practical_application, prayer. Não inclua markdown, blocos de código ou texto fora do JSON.",
    messages: [{ role: "user", content: prompt }],
  });

  let jsonStr = (message.content[0] as any).text.trim();
  if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');

  return JSON.parse(jsonStr);
}

function validateTranslation(original: any, translated: any) {
  const warnings = [];
  let isPass = true;

  const requiredFields = ['title', 'principle_statement', 'reflection'];
  for (const field of requiredFields) {
    if (!translated[field] || translated[field].trim() === '') {
      isPass = false;
      warnings.push(`Missing required field in translation: ${field}`);
    }
  }

  const origLength = original.reflection?.length || 0;
  const transLength = translated.reflection?.length || 0;
  if (origLength > 0 && (transLength < origLength * 0.5 || transLength > origLength * 1.5)) {
    warnings.push("Significant length variation in reflection");
  }

  return { pass: isPass && warnings.length === 0, warnings };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Verify caller is an authenticated admin
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const callerToken = authHeader.replace('Bearer ', '');
  const callerClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') || '', {
    global: { headers: { Authorization: `Bearer ${callerToken}` } },
  });
  const { data: { user }, error: authError } = await callerClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!roleRow || !['admin', 'super_admin'].includes(roleRow.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { data: jobs, error: claimError } = await supabase.rpc('claim_translation_jobs', {
      p_worker_id: workerId,
      p_limit: TRANSLATION_BATCH_SIZE,
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
        const { data: devotional } = await supabase
          .from('devotionals')
          .select('*')
          .eq('id', job.devotional_id)
          .single();

        if (!devotional) throw new Error("Original devotional not found.");

        const glossaryContext = await getGlossary(job.source_language, job.target_language);
        const translatedData = await callClaude(devotional, job.target_language, glossaryContext);
        const validation = validateTranslation(devotional, translatedData);

        const { error: upsertError } = await supabase
          .from('devotional_translations')
          .upsert({
            devotional_id: job.devotional_id,
            language: job.target_language,
            title: translatedData.title,
            principle_statement: translatedData.principle_statement,
            scripture_reference: translatedData.scripture_reference || devotional.scripture_reference || null,
            scripture_text: translatedData.scripture_text || devotional.scripture_text || null,
            reflection: translatedData.reflection,
            practical_application: translatedData.practical_application,
            prayer: translatedData.prayer,
            source_content_hash: devotional.content_hash,
            status: validation.pass ? 'published' : 'draft',
            validation_warnings: validation.warnings.length > 0 ? validation.warnings : null,
            translation_source: 'ai',
          }, { onConflict: 'devotional_id,language,translation_source' });

        if (upsertError) throw upsertError;

        await supabase
          .from('translation_jobs')
          .update({
            status: 'completed',
            error_message: null,
            warning_details: validation.warnings.length > 0 ? validation.warnings : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        results.push({ job_id: job.id, status: 'completed' });

      } catch (err: any) {
        attemptStatus = 'error';
        errorDetails = err.message;

        const newStatus = job.attempts >= TRANSLATION_MAX_RETRIES ? 'failed' : 'queued';

        await supabase
          .from('translation_jobs')
          .update({ status: newStatus, error_message: err.message, updated_at: new Date().toISOString() })
          .eq('id', job.id);

        results.push({ job_id: job.id, status: newStatus, error: err.message });
      }

      await supabase.from('translation_job_attempts').insert({
        job_id: job.id,
        attempt_number: job.attempts,
        status: attemptStatus,
        error_details: errorDetails,
        provider: 'claude',
        model: TRANSLATION_MODEL,
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

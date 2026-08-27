import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";

const TRANSLATION_BATCH_SIZE = parseInt(Deno.env.get("TRANSLATION_BATCH_SIZE") || "5", 10);
const TRANSLATION_MAX_RETRIES = parseInt(Deno.env.get("TRANSLATION_MAX_RETRIES") || "3", 10);
const TRANSLATION_MODEL = Deno.env.get("ANTHROPIC_TRANSLATION_MODEL") || "claude-sonnet-5";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const workerId = `worker-${crypto.randomUUID()}`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `
You are the official translation engine for 3 Minutes for Life.

Your task is TRANSLATION ONLY.

You are NOT an editor, copywriter, theologian, commentator, or content adapter.

The Portuguese version provided by the system is the canonical source.

Your responsibility is to translate the devotional faithfully into the requested language while preserving:

1. THEOLOGICAL FIDELITY
- Preserve the theological meaning of the original text.
- Do not reinterpret doctrines.
- Do not introduce theological concepts that are absent from the original.
- Do not remove theological concepts that are present in the original.
- Do not soften, intensify, modernize, secularize, or reinterpret theological statements.
- Do not introduce inclusive-language adaptations when doing so would alter theological meaning.
- Preserve references to God, Jesus Christ, the Holy Spirit, salvation, sin, grace, repentance, faith, Scripture, church, prayer, and other theological concepts according to the original meaning.

2. BIBLICAL FIDELITY
- Preserve Bible references exactly unless the target language convention requires a standard textual equivalent.
- Never invent a Bible reference.
- Never change the meaning of a quoted biblical passage.
- When the original contains a Bible quotation, translate it faithfully rather than paraphrasing it.
- Do not replace one Bible translation with another unless explicitly instructed.

3. DEVOTIONAL TONE
- Preserve the pastoral, devotional and reflective character of the original.
- The translation should sound natural to a native speaker.
- Natural language is allowed, but rewriting the author's message is not.
- Preserve the emotional weight and spiritual seriousness of the original.
- Do not make the text sound academic, commercial, promotional, artificial, or generic.

4. AUTHORIAL INTENT
- Preserve the author's argument, emphasis, progression and conclusion.
- Do not add explanations.
- Do not remove ideas for brevity.
- Do not create new illustrations.
- Do not add applications that are not present in the original.
- Do not turn statements into questions or questions into statements unless required by grammar.

5. STRUCTURE
- Preserve paragraph structure whenever reasonably possible.
- Preserve headings and labels.
- Preserve ALL HTML tags exactly as they appear in the source (e.g. <p>, <strong>, <em>, <u>, <h2>, <h3>, <blockquote>).
- Do not translate HTML class names or technical HTML attributes.
- If the text contains CTA blocks in the format <div data-type="cta" data-title="..." data-description="..." data-label="..." data-url="..." data-action="..."></div>: preserve the element exactly in its position; translate only the values of data-title, data-description, and data-label; never alter data-type, data-url, or data-action; never remove, recreate, or reposition the CTA block.
- Do not introduce Markdown unless it already exists in the source.
- Do not introduce HTML that does not exist in the source.

6. LANGUAGE QUALITY
- Produce idiomatic, fluent native-level language.
- Avoid literal translations that sound unnatural.
- However, naturalness must NEVER override theological or semantic fidelity.

7. STRICT PROHIBITIONS
Never:
- summarize;
- expand;
- explain;
- interpret;
- rewrite;
- improve the theology;
- add Bible verses;
- remove Bible verses;
- add prayers;
- remove prayers;
- add calls to action;
- change the author's theological position.

Return ONLY valid JSON matching the requested schema.
Do not include markdown fences.
Do not include explanations before or after the JSON.
`;

interface Devotional {
  id: string;
  title: string;
  principle_statement: string | null;
  scripture_reference: string | null;
  scripture_text: string | null;
  reflection: string | null;
  practical_application: string | null;
  prayer: string | null;
  content_hash: string | null;
}

interface TranslationResult {
  title: string;
  principle_statement: string;
  scripture_reference: string;
  scripture_text: string;
  reflection: string;
  practical_application: string | null;
  prayer: string | null;
}

async function getGlossary(sourceLang: string, targetLang: string): Promise<string> {
  const { data } = await supabase
    .from("translation_glossary")
    .select("source_term, target_term")
    .eq("source_language", sourceLang)
    .eq("target_language", targetLang);

  if (!data || data.length === 0) return "";
  return (
    "EDITORIAL GLOSSARY (always use these translations for these exact terms):\n" +
    data.map((g: { source_term: string; target_term: string }) =>
      `- "${g.source_term}" → "${g.target_term}"`
    ).join("\n")
  );
}

async function callClaude(
  devotional: Devotional,
  targetLang: string,
  glossaryContext: string,
): Promise<TranslationResult> {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

  const languageName =
    targetLang === "en" ? "English" : targetLang === "es" ? "Spanish" : targetLang;

  const glossarySection = glossaryContext ? `\n${glossaryContext}\n` : "";

  const userPrompt = `
Translate the following 3 Minutes for Life devotional from Brazilian Portuguese into ${languageName}.

IMPORTANT: Translate only. Do not adapt, rewrite, summarize, or interpret.
${glossarySection}
Return exactly this JSON structure — no markdown fences, no text outside the JSON:

{
  "title": "translated title",
  "principle_statement": "translated principle statement",
  "scripture_reference": "translated/reference-preserved Bible reference",
  "scripture_text": "translated Bible text",
  "reflection": "translated reflection (preserve all HTML tags exactly)",
  "practical_application": "translated practical application (preserve all HTML tags exactly) or null",
  "prayer": "translated prayer or null"
}

SOURCE LANGUAGE: Portuguese (Brazil)
TARGET LANGUAGE: ${languageName}

TITLE:
${devotional.title}

PRINCIPLE STATEMENT:
${devotional.principle_statement ?? ""}

SCRIPTURE REFERENCE:
${devotional.scripture_reference ?? ""}

SCRIPTURE TEXT:
${devotional.scripture_text ?? ""}

REFLECTION:
${devotional.reflection ?? ""}

PRACTICAL APPLICATION:
${devotional.practical_application ?? ""}

PRAYER:
${devotional.prayer ?? ""}
`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: TRANSLATION_MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const textBlock = data?.content?.find((block: { type?: string }) => block.type === "text");

  if (!textBlock?.text) throw new Error("Anthropic returned no text content");

  let jsonStr = textBlock.text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  }

  return JSON.parse(jsonStr);
}

function validateTranslation(
  original: Devotional,
  translated: TranslationResult,
): { pass: boolean; warnings: string[] } {
  const warnings: string[] = [];

  const requiredFields = ["title", "principle_statement", "reflection"] as const;
  for (const field of requiredFields) {
    if (!translated[field] || translated[field].trim() === "") {
      warnings.push(`Missing required field: ${field}`);
    }
  }

  if (
    original.scripture_reference &&
    (!translated.scripture_reference || translated.scripture_reference.trim() === "")
  ) {
    warnings.push("Bible reference missing from translation");
  }

  const origLen = original.reflection?.length || 0;
  const transLen = translated.reflection?.length || 0;
  if (origLen > 500 && transLen < origLen * 0.45) {
    warnings.push("Reflection appears significantly shorter than source");
  }
  if (origLen > 0 && transLen > origLen * 1.5) {
    warnings.push("Reflection appears significantly longer than source");
  }

  return { pass: warnings.length === 0, warnings };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Claim jobs atomically from the queue
    const { data: jobs, error: claimError } = await supabase.rpc("claim_translation_jobs", {
      p_worker_id: workerId,
      p_limit: TRANSLATION_BATCH_SIZE,
    });

    if (claimError) throw claimError;
    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: "No queued jobs found." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const job of jobs) {
      let attemptStatus = "success";
      let errorDetails: string | null = null;

      try {
        const { data: devotional } = await supabase
          .from("devotionals")
          .select("id, title, principle_statement, scripture_reference, scripture_text, reflection, practical_application, prayer, content_hash")
          .eq("id", job.devotional_id)
          .single();

        if (!devotional) throw new Error("Original devotional not found.");

        const glossaryContext = await getGlossary(job.source_language, job.target_language);

        const translatedData = await callClaude(devotional, job.target_language, glossaryContext);

        const validation = validateTranslation(devotional, translatedData);

        const { error: upsertError } = await supabase
          .from("devotional_translations")
          .upsert(
            {
              devotional_id: job.devotional_id,
              language: job.target_language,
              title: translatedData.title,
              principle_statement: translatedData.principle_statement,
              scripture_reference:
                translatedData.scripture_reference || devotional.scripture_reference || null,
              scripture_text:
                translatedData.scripture_text || devotional.scripture_text || null,
              reflection: translatedData.reflection,
              practical_application: translatedData.practical_application,
              prayer: translatedData.prayer,
              source_content_hash: devotional.content_hash,
              status: validation.pass ? "published" : "draft",
              validation_warnings: validation.warnings.length > 0 ? validation.warnings : null,
              translation_source: "ai",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "devotional_id,language,translation_source" },
          );

        if (upsertError) throw upsertError;

        await supabase
          .from("translation_jobs")
          .update({
            status: "completed",
            error_message: null,
            warning_details: validation.warnings.length > 0 ? validation.warnings : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        results.push({ job_id: job.id, status: "completed" });
      } catch (err: unknown) {
        attemptStatus = "error";
        errorDetails = err instanceof Error ? err.message : String(err);

        const newStatus = job.attempts >= TRANSLATION_MAX_RETRIES ? "failed" : "queued";

        await supabase
          .from("translation_jobs")
          .update({
            status: newStatus,
            error_message: errorDetails,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        results.push({ job_id: job.id, status: newStatus, error: errorDetails });
      }

      // Record attempt history
      await supabase.from("translation_job_attempts").insert({
        job_id: job.id,
        attempt_number: job.attempts,
        status: attemptStatus,
        error_details: errorDetails,
        provider: "anthropic",
        model: TRANSLATION_MODEL,
      });
    }

    return new Response(JSON.stringify({ processed: jobs.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("translate-devotional error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SUPPORTED_LANGS = ["pt-BR", "en", "es"] as const;
type Lang = typeof SUPPORTED_LANGS[number];
const DEFAULT_LANG: Lang = "pt-BR";
const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function ok(data: unknown, meta: Record<string, unknown> = {}): Response {
  return new Response(
    JSON.stringify({ data, meta, error: null }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

function err(status: number, code: string, message: string): Response {
  return new Response(
    JSON.stringify({ data: null, meta: {}, error: { code, message } }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

// ---------------------------------------------------------------------------
// API key auth + rate limiting
// ---------------------------------------------------------------------------

async function authenticate(
  req: Request,
): Promise<{ keyId: string; appId: string; rateLimit: number } | Response> {
  const authHeader = req.headers.get("Authorization") || req.headers.get("x-api-key");
  if (!authHeader) return err(401, "MISSING_KEY", "API key required. Pass it via Authorization: Bearer <key> or X-API-Key: <key>.");

  const rawKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim();
  if (!rawKey) return err(401, "MISSING_KEY", "API key is empty.");

  // Hash the incoming key for lookup
  const encoder = new TextEncoder();
  const data = encoder.encode(rawKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const keyHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const { data: apiKey, error } = await supabase
    .from("api_keys")
    .select("id, application_id, is_active, rate_limit_per_hour, expires_at, api_applications(is_active)")
    .eq("key_hash", keyHash)
    .single();

  if (error || !apiKey) return err(401, "INVALID_KEY", "API key not found.");
  if (!apiKey.is_active) return err(401, "KEY_INACTIVE", "This API key has been deactivated.");
  if (!apiKey.api_applications?.is_active) return err(401, "APP_INACTIVE", "This application has been deactivated.");
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    return err(401, "KEY_EXPIRED", "This API key has expired.");
  }

  // Rate limit: count requests in the last hour
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("api_request_logs")
    .select("id", { count: "exact", head: true })
    .eq("api_key_id", apiKey.id)
    .gte("created_at", since);

  if ((count ?? 0) >= apiKey.rate_limit_per_hour) {
    return err(429, "RATE_LIMIT", `Rate limit exceeded: ${apiKey.rate_limit_per_hour} requests/hour.`);
  }

  // Update last_used_at (fire-and-forget)
  supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", apiKey.id);

  return { keyId: apiKey.id, appId: apiKey.application_id, rateLimit: apiKey.rate_limit_per_hour };
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function logRequest(
  keyId: string,
  appId: string,
  endpoint: string,
  statusCode: number,
  responseTimeMs: number,
  ip: string | null,
  lang: string,
) {
  // fire-and-forget
  supabase.from("api_request_logs").insert({
    api_key_id: keyId,
    application_id: appId,
    endpoint,
    method: "GET",
    status_code: statusCode,
    response_time_ms: responseTimeMs,
    ip_address: ip,
    lang,
  });
}

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

const DEVOTIONAL_FIELDS = `
  id, publication_date, title, principle_statement,
  scripture_reference, scripture_text,
  reflection, practical_application, prayer,
  status,
  categories(id, name),
  themes(id, name)
`.trim();

const TRANSLATION_FIELDS = `
  title, principle_statement,
  scripture_reference, scripture_text,
  reflection, practical_application, prayer
`.trim();

function formatDevotional(row: Record<string, unknown>, lang: Lang, translation?: Record<string, unknown>) {
  const content = lang === "pt-BR" || !translation
    ? {
        title: row.title,
        principle_statement: row.principle_statement ?? null,
        scripture_reference: row.scripture_reference ?? null,
        scripture_text: row.scripture_text ?? null,
        reflection: row.reflection,
        practical_application: row.practical_application ?? null,
        prayer: row.prayer ?? null,
      }
    : {
        title: translation.title,
        principle_statement: translation.principle_statement ?? null,
        scripture_reference: translation.scripture_reference ?? row.scripture_reference ?? null,
        scripture_text: translation.scripture_text ?? row.scripture_text ?? null,
        reflection: translation.reflection,
        practical_application: translation.practical_application ?? null,
        prayer: translation.prayer ?? null,
      };

  return {
    id: row.id,
    publication_date: row.publication_date,
    language: lang,
    ...content,
    category: row.categories ?? null,
    theme: row.themes ?? null,
  };
}

async function fetchTranslation(devotionalId: string, lang: Lang) {
  const { data } = await supabase
    .from("devotional_translations")
    .select(TRANSLATION_FIELDS)
    .eq("devotional_id", devotionalId)
    .eq("language", lang)
    .eq("status", "published")
    .single();
  return data ?? null;
}

// ---------------------------------------------------------------------------
// Endpoint handlers
// ---------------------------------------------------------------------------

async function handleToday(lang: Lang): Promise<Response> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD in UTC

  const { data: devotional, error } = await supabase
    .from("devotionals")
    .select(DEVOTIONAL_FIELDS)
    .eq("status", "published")
    .eq("publication_date", today)
    .single();

  if (error || !devotional) {
    return err(404, "NOT_FOUND", `No published devotional found for today (${today}).`);
  }

  let translation = null;
  if (lang !== "pt-BR") {
    translation = await fetchTranslation(devotional.id as string, lang);
    if (!translation) {
      return err(404, "TRANSLATION_NOT_FOUND", `Translation for language '${lang}' is not available for today's devotional.`);
    }
  }

  return ok(formatDevotional(devotional, lang, translation ?? undefined), { date: today, language: lang });
}

async function handleLibrary(lang: Lang, page: number, limit: number, categoryId?: string): Promise<Response> {
  const offset = (page - 1) * limit;

  let query = supabase
    .from("devotionals")
    .select(DEVOTIONAL_FIELDS + ", devotional_translations!inner(language, status)", { count: "exact" })
    .eq("status", "published")
    .order("publication_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (lang !== "pt-BR") {
    query = query
      .eq("devotional_translations.language", lang)
      .eq("devotional_translations.status", "published");
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data: rows, count, error } = await query;

  if (error) return err(500, "DB_ERROR", "Failed to fetch devotionals.");

  const devotionals = (rows ?? []).map((row: Record<string, unknown>) => {
    const translations = (row.devotional_translations as Record<string, unknown>[] | null) ?? [];
    const translation = translations[0] ?? null;
    const { devotional_translations: _t, ...clean } = row;
    return formatDevotional(clean, lang, translation ?? undefined);
  });

  const totalPages = Math.ceil((count ?? 0) / limit);

  return ok(devotionals, {
    language: lang,
    page,
    limit,
    total: count ?? 0,
    total_pages: totalPages,
    has_next: page < totalPages,
  });
}

async function handleById(id: string, lang: Lang): Promise<Response> {
  // Accept both UUID and legacy_id (integer)
  const isUuid = /^[0-9a-f-]{36}$/i.test(id);

  let query = supabase.from("devotionals").select(DEVOTIONAL_FIELDS).eq("status", "published");
  query = isUuid ? query.eq("id", id) : query.eq("legacy_id", parseInt(id));

  const { data: devotional, error } = await query.single();

  if (error || !devotional) return err(404, "NOT_FOUND", `Devotional '${id}' not found.`);

  let translation = null;
  if (lang !== "pt-BR") {
    translation = await fetchTranslation(devotional.id as string, lang);
    if (!translation) {
      return err(404, "TRANSLATION_NOT_FOUND", `Translation for language '${lang}' is not available for devotional '${id}'.`);
    }
  }

  return ok(formatDevotional(devotional, lang, translation ?? undefined), { language: lang });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

function parseLang(url: URL): Lang {
  const raw = url.searchParams.get("lang") ?? DEFAULT_LANG;
  return (SUPPORTED_LANGS as readonly string[]).includes(raw) ? (raw as Lang) : DEFAULT_LANG;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return err(405, "METHOD_NOT_ALLOWED", "Only GET requests are accepted.");

  const start = Date.now();
  const url = new URL(req.url);
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? null;

  // Strip the function prefix: /partner-api/<path>
  const segments = url.pathname.replace(/^\/partner-api\/?/, "").split("/").filter(Boolean);
  const lang = parseLang(url);

  // Auth
  const auth = await authenticate(req);
  if (auth instanceof Response) return auth;
  const { keyId, appId } = auth;

  let response: Response;
  let endpoint = url.pathname;

  try {
    if (segments[0] === "devotionals" && segments[1] === "today" && !segments[2]) {
      // GET /devotionals/today
      endpoint = "/devotionals/today";
      response = await handleToday(lang);

    } else if (segments[0] === "devotionals" && segments[1] && segments[1] !== "today") {
      // GET /devotionals/:id
      endpoint = "/devotionals/:id";
      response = await handleById(segments[1], lang);

    } else if (segments[0] === "devotionals" && !segments[1]) {
      // GET /devotionals
      endpoint = "/devotionals";
      const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
      const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(url.searchParams.get("limit") ?? String(DEFAULT_PAGE_LIMIT))));
      const categoryId = url.searchParams.get("category") ?? undefined;
      response = await handleLibrary(lang, page, limit, categoryId);

    } else {
      response = err(404, "UNKNOWN_ENDPOINT", `Endpoint not found. Available: GET /devotionals/today, GET /devotionals, GET /devotionals/:id`);
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("partner-api error:", message);
    response = err(500, "INTERNAL_ERROR", "An unexpected error occurred.");
  }

  logRequest(keyId, appId, endpoint, response.status, Date.now() - start, ip, lang);
  return response;
});

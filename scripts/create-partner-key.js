/**
 * Cria um parceiro e gera sua API key.
 *
 * Antes de rodar, adicione ao .env.local:
 *   SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *
 * Uso:
 *   node scripts/create-partner-key.js --name "Nome" --email "email@parceiro.com"
 */
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";
import { parseArgs } from "util";
import { readFileSync } from "fs";
import { resolve } from "path";

// Carrega .env.local manualmente (sem depender de dotenv instalado globalmente)
function loadEnv(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex < 1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const val = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // arquivo nao encontrado — ok, usa variaveis de ambiente do shell
  }
}

// Tenta carregar .env.local e .env.remote na raiz do projeto
const root = resolve(process.cwd());
loadEnv(resolve(root, ".env.local"));
loadEnv(resolve(root, ".env.remote"));
loadEnv(resolve(root, ".env"));

// ── Args ─────────────────────────────────────────────────────────────────────

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    name:         { type: "string" },
    email:        { type: "string" },
    description:  { type: "string" },
    "rate-limit": { type: "string", default: "1000" },
    "key-name":   { type: "string", default: "Production" },
  },
  strict: true,
});

if (!values.name || !values.email) {
  console.error("Erro: --name e --email sao obrigatorios.");
  process.exit(1);
}

// ── Supabase ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("Erro: SUPABASE_URL nao encontrada. Adicione ao .env.local");
  process.exit(1);
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Erro: SUPABASE_SERVICE_ROLE_KEY nao encontrada. Adicione ao .env.local:");
  console.error("  SUPABASE_SERVICE_ROLE_KEY=eyJ...");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Key generation ────────────────────────────────────────────────────────────

function generateKey() {
  return "3mfl_" + randomBytes(24).toString("base64url");
}

function hashKey(rawKey) {
  return createHash("sha256").update(rawKey).digest("hex");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const rateLimit = parseInt(values["rate-limit"], 10);

  console.log("\n3 Minutes for Life - Partner API Key Generator");
  console.log("=".repeat(52));

  const { data: app, error: appError } = await supabase
    .from("api_applications")
    .insert({
      name: values.name,
      contact_email: values.email,
      description: values.description ?? null,
    })
    .select("id, name, contact_email")
    .single();

  if (appError) {
    console.error("Erro ao criar aplicacao:", appError.message);
    process.exit(1);
  }

  console.log("\n[OK] Parceiro criado");
  console.log("  ID:   ", app.id);
  console.log("  Nome: ", app.name);
  console.log("  Email:", app.contact_email);

  const rawKey = generateKey();
  const keyHash = hashKey(rawKey);
  const keyPrefix = rawKey.slice(0, 12);

  const { data: apiKey, error: keyError } = await supabase
    .from("api_keys")
    .insert({
      application_id: app.id,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      name: values["key-name"],
      rate_limit_per_hour: rateLimit,
    })
    .select("id")
    .single();

  if (keyError) {
    await supabase.from("api_applications").delete().eq("id", app.id);
    console.error("Erro ao criar API key:", keyError.message);
    process.exit(1);
  }

  const baseUrl = SUPABASE_URL + "/functions/v1";

  console.log("\n[OK] API Key gerada");
  console.log("  Key ID:    ", apiKey.id);
  console.log("  Prefixo:   ", keyPrefix + "...");
  console.log("  Rate limit:", rateLimit, "req/hora");
  console.log("\n" + "-".repeat(52));
  console.log("  ENVIE AO PARCEIRO:");
  console.log("-".repeat(52));
  console.log("\n  Base URL:");
  console.log("  " + baseUrl + "/partner-api");
  console.log("\n  API Key (exibida UMA VEZ - copie agora):\n");
  console.log("  " + rawKey);
  console.log("\n" + "-".repeat(52));
  console.log("  Exemplo:");
  console.log("  curl " + baseUrl + "/partner-api/devotionals/today \\");
  console.log('    -H "Authorization: Bearer ' + rawKey + '"');
  console.log("\n" + "=".repeat(52));
  console.log("  A chave NAO esta salva. Se perder, gere uma nova.");
  console.log("=".repeat(52) + "\n");
}

main().catch((e) => { console.error("Erro:", e.message); process.exit(1); });

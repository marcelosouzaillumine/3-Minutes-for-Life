import { execSync } from 'child_process';
import fs from 'fs';

console.log("Running PL/pgSQL validation script on remote db...");
const out = execSync(`npx supabase db query --file scripts/test_rls.sql`).toString();

// The output will contain a JSON array (or multiple lines). We just parse it.
const lines = out.split('\n');
let jsonStr = '';
for (let line of lines) {
  if (line.includes('[{')) {
    jsonStr = line.substring(line.indexOf('[{'));
    break;
  }
}

if (!jsonStr) {
  console.error("Failed to parse JSON result from Supabase.");
  console.log(out);
  process.exit(1);
}

const matrix = JSON.parse(jsonStr);

let md = '# Gate 4 RLS Security Validation Matrix\n\n';
md += '| Test | Actor | Operation | Target | Actual (Error/Rows) | Result |\n';
md += '|------|-------|-----------|--------|---------------------|--------|\n';

let allPass = true;
for (const m of matrix) {
  let cleanActual = (m.actual || '').replace(/\n/g, ' ').substring(0, 80);
  let resStr = m.pass ? '**PASS**' : '**FAIL**';
  if (!m.pass) allPass = false;
  md += `| ${m.test} | ${m.actor} | ${m.op} | ${m.actual} | ${cleanActual} | ${resStr} |\n`;
}

fs.writeFileSync('/Users/marcelosouza/.gemini/antigravity-ide/brain/5c773dfa-fba1-4e12-9a5e-77c7cdc4b65a/Gate_4_RLS_Matrix.md', md);
console.log("Wrote matrix to artifacts.");

if (allPass) {
  console.log("GATE 4 — CERTIFIED");
} else {
  console.log("GATE 4 — NOT CERTIFIED");
}

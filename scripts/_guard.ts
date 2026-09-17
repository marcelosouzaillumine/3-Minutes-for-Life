/**
 * Trava de segurança para scripts de teste/auditoria que executam
 * INSERT/DELETE/DROP reais contra o Supabase configurado em
 * SUPABASE_URL/VITE_SUPABASE_URL.
 *
 * Por quê: não existe um projeto Supabase de staging separado neste
 * projeto — só existe `wacdwnlrwsbmuhwztwrz` ("3-Minutes-for-Life"), que é
 * o banco real usado pelo app em produção. Sem esta trava, rodar por
 * engano `npx tsx scripts/formal_rls_audit_final.ts` (ou qualquer um dos
 * outros scripts de teste/auditoria e2e) mexe direto em `auth.users`,
 * `contributions`, `supporters`, `payment_events` reais.
 */
export function guardAgainstProduction(scriptName: string): void {
  if (process.env.I_UNDERSTAND_THIS_RUNS_AGAINST_THE_REAL_DATABASE === 'yes') return;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '(não definida)';
  console.error(`
❌ ${scriptName} foi bloqueado.

Este script executa operações destrutivas (INSERT/DELETE/DROP) diretamente
contra o banco Supabase configurado em SUPABASE_URL/VITE_SUPABASE_URL:

    ${url}

Não existe um projeto Supabase de staging separado neste projeto — essa é,
muito provavelmente, a base de dados real usada em produção.

Se você tem certeza de que quer rodar mesmo assim, defina explicitamente:

    I_UNDERSTAND_THIS_RUNS_AGAINST_THE_REAL_DATABASE=yes npx tsx ${scriptName}
`);
  process.exit(1);
}

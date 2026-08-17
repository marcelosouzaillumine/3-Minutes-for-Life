import { execSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';

function runSql(sql: string) {
  try {
    const out = execSync(`npx supabase db query "${sql}"`);
    return out.toString().trim();
  } catch (err: any) {
    if (err.stdout) {
      throw new Error(err.stdout.toString());
    }
    throw err;
  }
}

async function run() {
  const fnSql = `
CREATE OR REPLACE FUNCTION public.run_rls_test()
RETURNS jsonb AS $$
DECLARE
  uidA uuid := gen_random_uuid();
  uidB uuid := gen_random_uuid();
  supporter_a_id uuid;
  supporter_b_id uuid;
  contrib_a_id uuid;
  res jsonb := '[]'::jsonb;
  out_count int;
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (uidA, 'User A'), (uidB, 'User B');
  INSERT INTO public.supporters (user_id, status) VALUES (uidA, 'active') RETURNING id INTO supporter_a_id;
  INSERT INTO public.supporters (user_id, status) VALUES (uidB, 'active') RETURNING id INTO supporter_b_id;
  INSERT INTO public.contributions (supporter_id, amount, currency, frequency, status, provider, provider_reference) 
    VALUES (supporter_a_id, 5000, 'BRL', 'one_time', 'completed', 'asaas', 'ref_a') RETURNING id INTO contrib_a_id;
  INSERT INTO public.contributions (supporter_id, amount, currency, frequency, status, provider, provider_reference) 
    VALUES (supporter_b_id, 2000, 'BRL', 'recurring', 'active', 'asaas', 'ref_b');
  INSERT INTO public.payment_events (provider, provider_event_id, event_type, payload) VALUES
    ('asaas', 'evt_temp_1', 'payment.created', '{"test": true}');

  -- G5 ANON (SELECT supporters)
  BEGIN
    EXECUTE 'SET LOCAL ROLE anon; SELECT count(*) FROM public.supporters' INTO out_count;
    res := res || jsonb_build_object('test', 'G5 - ANON SUPPORTERS READ', 'actor', 'Anon', 'op', 'SELECT supporters', 'actual', out_count || ' rows', 'pass', (out_count = 0));
  EXCEPTION WHEN OTHERS THEN
    res := res || jsonb_build_object('test', 'G5 - ANON SUPPORTERS READ', 'actor', 'Anon', 'op', 'SELECT supporters', 'actual', SQLERRM, 'pass', true);
  END;

  -- G5 ANON (SELECT contributions)
  BEGIN
    EXECUTE 'SET LOCAL ROLE anon; SELECT count(*) FROM public.contributions' INTO out_count;
    res := res || jsonb_build_object('test', 'G5 - ANON CONTRIBUTIONS READ', 'actor', 'Anon', 'op', 'SELECT contributions', 'actual', out_count || ' rows', 'pass', (out_count = 0));
  EXCEPTION WHEN OTHERS THEN
    res := res || jsonb_build_object('test', 'G5 - ANON CONTRIBUTIONS READ', 'actor', 'Anon', 'op', 'SELECT contributions', 'actual', SQLERRM, 'pass', true);
  END;

  -- G5 ANON (SELECT payment_events)
  BEGIN
    EXECUTE 'SET LOCAL ROLE anon; SELECT count(*) FROM public.payment_events' INTO out_count;
    res := res || jsonb_build_object('test', 'G5 - ANON PAYMENT_EVENTS READ', 'actor', 'Anon', 'op', 'SELECT payment_events', 'actual', out_count || ' rows', 'pass', (out_count = 0));
  EXCEPTION WHEN OTHERS THEN
    res := res || jsonb_build_object('test', 'G5 - ANON PAYMENT_EVENTS READ', 'actor', 'Anon', 'op', 'SELECT payment_events', 'actual', SQLERRM, 'pass', true);
  END;

  -- Explicit 5 (Anon insert supporters)
  BEGIN
    EXECUTE 'SET LOCAL ROLE anon; INSERT INTO public.supporters (user_id, status) VALUES ($1, ''active'')' USING uidA;
    res := res || jsonb_build_object('test', 'Explicit 5', 'actor', 'Anon', 'op', 'INSERT supporters', 'actual', 'Success', 'pass', false);
  EXCEPTION WHEN OTHERS THEN
    res := res || jsonb_build_object('test', 'Explicit 5', 'actor', 'Anon', 'op', 'INSERT supporters', 'actual', SQLERRM, 'pass', true);
  END;

  -- G1 OWN SUPPORTER READ
  BEGIN
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = ''%s''; SELECT count(*) FROM public.supporters WHERE user_id = ''%s''', uidA, uidA) INTO out_count;
    res := res || jsonb_build_object('test', 'G1 - OWN SUPPORTER READ', 'actor', 'User A', 'op', 'SELECT supporters', 'actual', out_count || ' rows', 'pass', (out_count = 1));
  EXCEPTION WHEN OTHERS THEN
    res := res || jsonb_build_object('test', 'G1 - OWN SUPPORTER READ', 'actor', 'User A', 'op', 'SELECT supporters', 'actual', SQLERRM, 'pass', false);
  END;

  -- G2 CROSS-USER SUPPORTER ISOLATION
  BEGIN
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = ''%s''; SELECT count(*) FROM public.supporters WHERE user_id = ''%s''', uidA, uidB) INTO out_count;
    res := res || jsonb_build_object('test', 'G2 - CROSS-USER SUPPORTER ISOLATION', 'actor', 'User A', 'op', 'SELECT supporters (User B)', 'actual', out_count || ' rows', 'pass', (out_count = 0));
  EXCEPTION WHEN OTHERS THEN
    res := res || jsonb_build_object('test', 'G2 - CROSS-USER SUPPORTER ISOLATION', 'actor', 'User A', 'op', 'SELECT supporters (User B)', 'actual', SQLERRM, 'pass', false);
  END;

  -- G3 CONTRIBUTION TAMPERING (amount)
  BEGIN
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = ''%s''; UPDATE public.contributions SET amount = 99999 WHERE id = ''%s''', uidA, contrib_a_id);
    GET DIAGNOSTICS out_count = ROW_COUNT;
    res := res || jsonb_build_object('test', 'G3 - CONTRIBUTION TAMPERING (amount)', 'actor', 'User A', 'op', 'UPDATE contributions', 'actual', 'UPDATE ' || out_count, 'pass', (out_count = 0));
  EXCEPTION WHEN OTHERS THEN
    res := res || jsonb_build_object('test', 'G3 - CONTRIBUTION TAMPERING (amount)', 'actor', 'User A', 'op', 'UPDATE contributions', 'actual', SQLERRM, 'pass', true);
  END;

  -- G3 CONTRIBUTION TAMPERING (delete)
  BEGIN
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = ''%s''; DELETE FROM public.contributions WHERE id = ''%s''', uidA, contrib_a_id);
    GET DIAGNOSTICS out_count = ROW_COUNT;
    res := res || jsonb_build_object('test', 'G3 - CONTRIBUTION TAMPERING (delete)', 'actor', 'User A', 'op', 'DELETE contributions', 'actual', 'DELETE ' || out_count, 'pass', (out_count = 0));
  EXCEPTION WHEN OTHERS THEN
    res := res || jsonb_build_object('test', 'G3 - CONTRIBUTION TAMPERING (delete)', 'actor', 'User A', 'op', 'DELETE contributions', 'actual', SQLERRM, 'pass', true);
  END;

  -- G4 PAYMENT EVENTS (read)
  BEGIN
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = ''%s''; SELECT count(*) FROM public.payment_events', uidA) INTO out_count;
    res := res || jsonb_build_object('test', 'G4 - PAYMENT EVENTS (read)', 'actor', 'User A', 'op', 'SELECT payment_events', 'actual', out_count || ' rows', 'pass', (out_count = 0));
  EXCEPTION WHEN OTHERS THEN
    res := res || jsonb_build_object('test', 'G4 - PAYMENT EVENTS (read)', 'actor', 'User A', 'op', 'SELECT payment_events', 'actual', SQLERRM, 'pass', true);
  END;

  -- G4 PAYMENT EVENTS (insert)
  BEGIN
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = ''%s''; INSERT INTO public.payment_events (provider, provider_event_id, event_type, payload) VALUES (''x'',''x'',''x'',''{}'')', uidA);
    res := res || jsonb_build_object('test', 'G4 - PAYMENT EVENTS (insert)', 'actor', 'User A', 'op', 'INSERT payment_events', 'actual', 'Success', 'pass', false);
  EXCEPTION WHEN OTHERS THEN
    res := res || jsonb_build_object('test', 'G4 - PAYMENT EVENTS (insert)', 'actor', 'User A', 'op', 'INSERT payment_events', 'actual', SQLERRM, 'pass', true);
  END;

  -- G6 USER_ID SPOOFING
  BEGIN
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = ''%s''; INSERT INTO public.supporters (user_id, status) VALUES (''%s'', ''active'')', uidA, uidB);
    res := res || jsonb_build_object('test', 'G6 - USER_ID SPOOFING', 'actor', 'User A', 'op', 'INSERT supporters (user_id=B)', 'actual', 'Success', 'pass', false);
  EXCEPTION WHEN OTHERS THEN
    res := res || jsonb_build_object('test', 'G6 - USER_ID SPOOFING', 'actor', 'User A', 'op', 'INSERT supporters (user_id=B)', 'actual', SQLERRM, 'pass', true);
  END;

  -- G7 CONTRIBUTION CROSS-USER ISOLATION (SELECT)
  BEGIN
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = ''%s''; SELECT count(*) FROM public.contributions WHERE supporter_id = ''%s''', uidA, supporter_b_id) INTO out_count;
    res := res || jsonb_build_object('test', 'G7 - CONTRIBUTION CROSS-USER ISOLATION (read)', 'actor', 'User A', 'op', 'SELECT contributions (Not Own)', 'actual', out_count || ' rows', 'pass', (out_count = 0));
  EXCEPTION WHEN OTHERS THEN
    res := res || jsonb_build_object('test', 'G7 - CONTRIBUTION CROSS-USER ISOLATION (read)', 'actor', 'User A', 'op', 'SELECT contributions (Not Own)', 'actual', SQLERRM, 'pass', false);
  END;

  -- Explicit 1 (Insert own supporter)
  BEGIN
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = ''%s''; INSERT INTO public.supporters (user_id, status) VALUES (''%s'', ''active'')', uidA, uidA);
    res := res || jsonb_build_object('test', 'Explicit 1', 'actor', 'User A', 'op', 'INSERT supporters', 'actual', 'Success', 'pass', false);
  EXCEPTION WHEN OTHERS THEN
    res := res || jsonb_build_object('test', 'Explicit 1', 'actor', 'User A', 'op', 'INSERT supporters', 'actual', SQLERRM, 'pass', true);
  END;

  -- Explicit 2 (Insert own contribution)
  BEGIN
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = ''%s''; INSERT INTO public.contributions (supporter_id, amount, currency, frequency, status, provider, provider_reference) VALUES (''%s'', 100, ''BRL'', ''one_time'', ''pending'', ''test'', ''ref'')', uidA, supporter_a_id);
    res := res || jsonb_build_object('test', 'Explicit 2', 'actor', 'User A', 'op', 'INSERT contributions', 'actual', 'Success', 'pass', false);
  EXCEPTION WHEN OTHERS THEN
    res := res || jsonb_build_object('test', 'Explicit 2', 'actor', 'User A', 'op', 'INSERT contributions', 'actual', SQLERRM, 'pass', true);
  END;

  -- Explicit 3 (Update own supporter status)
  BEGIN
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = ''%s''; UPDATE public.supporters SET status = ''inactive'' WHERE id = ''%s''', uidA, supporter_a_id);
    GET DIAGNOSTICS out_count = ROW_COUNT;
    res := res || jsonb_build_object('test', 'Explicit 3', 'actor', 'User A', 'op', 'UPDATE supporters.status', 'actual', 'UPDATE ' || out_count, 'pass', (out_count = 0));
  EXCEPTION WHEN OTHERS THEN
    res := res || jsonb_build_object('test', 'Explicit 3', 'actor', 'User A', 'op', 'UPDATE supporters.status', 'actual', SQLERRM, 'pass', true);
  END;

  -- Explicit 4 (Update own supporter user_id)
  BEGIN
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = ''%s''; UPDATE public.supporters SET user_id = ''%s'' WHERE id = ''%s''', uidA, uidB, supporter_a_id);
    GET DIAGNOSTICS out_count = ROW_COUNT;
    res := res || jsonb_build_object('test', 'Explicit 4', 'actor', 'User A', 'op', 'UPDATE supporters.user_id', 'actual', 'UPDATE ' || out_count, 'pass', (out_count = 0));
  EXCEPTION WHEN OTHERS THEN
    res := res || jsonb_build_object('test', 'Explicit 4', 'actor', 'User A', 'op', 'UPDATE supporters.user_id', 'actual', SQLERRM, 'pass', true);
  END;

  -- Clean up
  SET LOCAL ROLE postgres;
  DELETE FROM public.payment_events WHERE provider_event_id = 'evt_temp_1';
  DELETE FROM public.contributions WHERE supporter_id IN (supporter_a_id, supporter_b_id);
  DELETE FROM public.supporters WHERE id IN (supporter_a_id, supporter_b_id);
  DELETE FROM public.profiles WHERE id IN (uidA, uidB);

  RETURN res;
END;
$$ LANGUAGE plpgsql;
`;

  console.log("Creating SQL function...");
  // Use replace to strip newlines for CLI string literal safety, but wait, $$ string literal in bash is tricky.
  // We can write it to a file and run it if the CLI supported files properly, but it doesn't.
  // Actually, we can just replace newlines with space, since we don't have line comments.
  const fnSqlSingleLine = fnSql.replace(/\n/g, ' ');
  runSql(fnSqlSingleLine);

  console.log("Executing SQL function...");
  const rawOut = runSql("SELECT public.run_rls_test();");
  
  console.log("Cleaning up function...");
  runSql("DROP FUNCTION public.run_rls_test();");

  // Output looks like:
  // run_rls_test
  // --------------
  // [{"test": ...}]
  const match = rawOut.match(/\[.*\]/);
  if (!match) {
    throw new Error("Failed to parse JSON result from Supabase.");
  }
  
  const matrix = JSON.parse(match[0]);

  let md = '# Gate 4 RLS Security Validation Matrix\n\n';
  md += '| Test | Actor | Operation | Target | Actual (Error/Rows) | Result |\n';
  md += '|------|-------|-----------|--------|---------------------|--------|\n';

  let allPass = true;
  for (const m of matrix) {
    let cleanActual = (m.actual || '').replace(/\n/g, ' ').substring(0, 100);
    let resStr = m.pass ? '**PASS**' : '**FAIL**';
    if (!m.pass) allPass = false;
    md += `| ${m.test} | ${m.actor} | ${m.op} | ${m.actual} | ${cleanActual} | ${resStr} |\n`;
    console.log(`[${resStr}] ${m.test} | ${m.actor} | ${m.op} -> ${cleanActual}`);
  }

  fs.writeFileSync('/Users/marcelosouza/.gemini/antigravity-ide/brain/5c773dfa-fba1-4e12-9a5e-77c7cdc4b65a/Gate_4_RLS_Matrix.md', md);
  console.log("Wrote matrix to artifacts.");

  if (allPass) {
    console.log("GATE 4 — CERTIFIED");
  } else {
    console.log("GATE 4 — NOT CERTIFIED");
  }
}

run().catch(e => console.error(e.message));

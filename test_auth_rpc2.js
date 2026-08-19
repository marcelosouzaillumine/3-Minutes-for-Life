import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = 'http://127.0.0.1:54321';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const client = createClient(supabaseUrl, anonKey);

async function run() {
  const { data: session, error: loginErr } = await client.auth.signInWithPassword({
    email: 'admin_test@example.com',
    password: 'password123'
  });
  
  if (loginErr) { console.log('Login err:', loginErr); return; }
  
  const { data: rpc, error: rpcErr } = await client.rpc('get_admin_dashboard_metrics_2', {
    p_start_date: '2026-08-12',
    p_end_date: '2026-08-19'
  });
  console.log("RPC 2 via user:", rpc, rpcErr);
}
run();

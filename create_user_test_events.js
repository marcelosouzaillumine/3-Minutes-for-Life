import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const adminClient = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: events, error } = await adminClient.from('app_events')
    .select('id, occurred_at')
    .gte('occurred_at', '2026-08-12')
    .lte('occurred_at', '2026-08-19T23:59:59Z');
    
  console.log("Events count via admin client:", events?.length);
  
  const { data: rpc, error: rpcErr } = await adminClient.rpc('get_admin_dashboard_metrics_2', {
    p_start_date: '2026-08-12',
    p_end_date: '2026-08-19'
  });
  console.log("RPC 2 via admin client:", rpc);
}
run();

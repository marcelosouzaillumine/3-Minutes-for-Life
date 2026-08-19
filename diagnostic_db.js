import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- 1. Testing app_events direct query (Database) ---");
  const { data: events, error: errEvents } = await supabase
    .from('app_events')
    .select('*')
    .order('occurred_at', { ascending: false })
    .limit(10);
  
  if (errEvents) console.error("Error events:", errEvents);
  else console.log("Recent app_events count:", events.length, events.map(e => e.event_type));

  console.log("\n--- 2. Testing RPC get_admin_dashboard_metrics (Function) ---");
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 7);
  
  const startStr = start.toISOString().split('T')[0];
  const endStr = today.toISOString().split('T')[0];
  
  const { data: rpcData, error: errRpc } = await supabase.rpc('get_admin_dashboard_metrics', {
    p_start_date: startStr,
    p_end_date: endStr
  });
  
  if (errRpc) console.error("Error RPC:", errRpc);
  else console.log("RPC Result:", JSON.stringify(rpcData, null, 2));
}

run();

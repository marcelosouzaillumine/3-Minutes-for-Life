import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = 'http://127.0.0.1:54321';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const client = createClient(supabaseUrl, anonKey);
const adminClient = createClient(supabaseUrl, serviceKey);

async function run() {
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: 'admin_test_2@example.com',
    password: 'password123',
    email_confirm: true
  });
  const userId = authData.user.id;

  await adminClient.from('user_roles').insert([
    { user_id: userId, role: 'admin' }
  ]);

  await adminClient.from('app_events').insert([
    { user_id: userId, anonymous_id: 'anon_123', event_type: 'devotional_opened', occurred_at: new Date().toISOString() },
    { anonymous_id: 'anon_123', event_type: 'devotional_opened', occurred_at: new Date(Date.now() - 86400000).toISOString() },
    { anonymous_id: 'anon_456', event_type: 'devotional_opened', occurred_at: new Date().toISOString() }
  ]);
  
  await client.auth.signInWithPassword({ email: 'admin_test_2@example.com', password: 'password123' });
  const start = new Date();
  start.setDate(start.getDate() - 7);
  
  const { data, error } = await client.rpc('get_admin_dashboard_metrics', {
    p_start_date: start.toISOString().split('T')[0],
    p_end_date: new Date().toISOString().split('T')[0]
  });
  console.log("RPC Error:", error);
  console.log("RPC Data:", JSON.stringify(data, null, 2));
}
run();

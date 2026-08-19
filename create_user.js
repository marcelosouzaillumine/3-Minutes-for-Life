import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const adminClient = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Creating user...');
  const { data: user, error } = await adminClient.auth.admin.createUser({
    email: 'admin_test@example.com',
    password: 'password123',
    email_confirm: true
  });
  if (error) {
    console.error('Create error:', error.message);
  } else {
    console.log('Created user:', user.user.id);
    
    // insert role
    const { error: roleErr } = await adminClient.from('user_roles').insert({
      user_id: user.user.id,
      role: 'admin'
    });
    if (roleErr) console.error('Role error:', roleErr.message);

    // login
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const client = createClient(supabaseUrl, anonKey);
    const { data: session, error: loginErr } = await client.auth.signInWithPassword({
      email: 'admin_test@example.com',
      password: 'password123'
    });
    
    if (loginErr) console.error('Login err:', loginErr.message);
    else {
      console.log('Calling RPC...');
      const { data: metrics, error: rpcErr } = await client.rpc('get_admin_dashboard_metrics', {
        p_start_date: '2026-08-12',
        p_end_date: '2026-08-19'
      });
      console.log('Metrics:', JSON.stringify(metrics, null, 2));
      console.log('RPC Error:', rpcErr);
    }
  }
}
run();

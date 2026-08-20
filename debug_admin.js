import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// Use PRODUCTION keys
const PROD_URL = process.env.VITE_SUPABASE_URL;
const PROD_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!PROD_URL || !PROD_KEY) {
  console.error('Missing env vars. VITE_SUPABASE_URL:', PROD_URL, 'VITE_SUPABASE_ANON_KEY:', PROD_KEY?.slice(0,10));
  process.exit(1);
}

console.log('Connecting to:', PROD_URL);

const supabase = createClient(PROD_URL, PROD_KEY);

async function run() {
  // 1. Check session
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Session:', session ? `User ${session.user.email}` : 'NONE');

  if (!session) {
    console.log('No session. Trying to sign in with env credentials...');
    // Try with test credentials
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: process.env.ADMIN_EMAIL || 'admin@test.com',
      password: process.env.ADMIN_PASSWORD || 'password123'
    });
    if (signInErr) {
      console.error('Sign in failed:', signInErr.message);
      console.log('Cannot test RPC without auth. Check user_roles table directly instead.');
    }
  }

  // 2. Call RPC directly
  const end = new Date().toISOString().split('T')[0];
  const start = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0];
  
  console.log(`\nCalling RPC with start=${start} end=${end}`);
  const { data, error } = await supabase.rpc('get_admin_dashboard_metrics', {
    p_start_date: start,
    p_end_date: end
  });
  
  if (error) {
    console.error('\nRPC Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('\nRPC Success:', JSON.stringify(data, null, 2));
  }
}

run().catch(e => console.error('Fatal:', e));

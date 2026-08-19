import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = 'http://127.0.0.1:54321';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const client = createClient(supabaseUrl, anonKey);

async function run() {
  await client.auth.signInWithPassword({ email: 'admin_test@example.com', password: 'password123' });
  const { data, error } = await client.rpc('test_sec_def');
  console.log("RPC test_sec_def via user:", data, error);
}
run();

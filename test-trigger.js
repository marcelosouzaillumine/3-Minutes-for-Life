import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const client = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function run() {
  const { data, error } = await client.rpc('get_triggers', { table_name: 'devotionals' }).maybeSingle();
  console.log(data);
}

run()

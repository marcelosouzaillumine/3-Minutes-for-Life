import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const client = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function run() {
  const { data, error } = await client
    .from('devotional_translations')
    .select('*')
    .eq('devotional_id', '55772fdb-db88-4ba2-a539-3c745d24e64d')
    .eq('language', 'en')
    .maybeSingle();
  
  console.log(JSON.stringify(data, null, 2))
}

run()

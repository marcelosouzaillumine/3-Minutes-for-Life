import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const client = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const { data, error } = await client
    .from('devotional_translations')
    .select('id, devotional_id, language, title, reflection, status')
    .eq('title', '');
  
  console.log("Empty translations:", data?.length);
}

run()

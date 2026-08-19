import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

import * as dotenv from 'dotenv'
dotenv.config()

const client = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function run() {
  const selectQuery = `
  id,
  title,
  publication_date,
  devotional_translations (
    id,
    language,
    title,
    status
  )
`;

  const { data, error } = await client
    .from('devotionals')
    .select(selectQuery)
    .eq('publication_date', '2026-08-19')
    .maybeSingle();
  
  console.log(JSON.stringify(data, null, 2))
}

run()

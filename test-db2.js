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
  subtitle,
  principle_statement,
  reflection,
  practical_application,
  prayer,
  scripture_reference,
  scripture_text,
  audio_url,
  theme_id,
  category_id,
  content_hash,
  categories (
    name
  ),
  devotional_translations (
    id,
    language,
    title,
    subtitle,
    principle_statement,
    reflection,
    practical_application,
    prayer,
    status,
    source_content_hash
  )
`;

  const { data, error } = await client
    .from('devotionals')
    .select(selectQuery)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  console.log(JSON.stringify(data.devotional_translations, null, 2))
}

run()

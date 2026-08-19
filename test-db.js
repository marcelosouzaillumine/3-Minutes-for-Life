import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// We need to read from .env
import * as dotenv from 'dotenv'
dotenv.config()

const client = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function run() {
  const { data, error } = await client.from('devotionals').select(`
    id,
    title,
    content_hash,
    devotional_translations (
      id,
      language,
      status,
      source_content_hash
    )
  `).limit(5)
  
  console.log(JSON.stringify(data, null, 2))
}

run()

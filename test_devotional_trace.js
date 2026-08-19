import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('devotionals')
    .select(`
      id, title, reflection, content_hash,
      devotional_translations (
        id, language, title, reflection, status, source_content_hash
      )
    `)
    .eq('status', 'published')
    .order('publication_date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error(error);
    return;
  }
  console.log("Returned Devotional:", JSON.stringify(data, null, 2));
}

test();

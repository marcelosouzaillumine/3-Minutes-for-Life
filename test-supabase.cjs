const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Parse .env directly since Vite's import.meta.env doesn't work in raw Node
const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('devotionals')
    .select('id, title, publication_date, devotional_translations(language, status, title)')
    .eq('publication_date', new Date().toISOString().split('T')[0])
    .maybeSingle();
    
  console.log('Result:', JSON.stringify({ data, error }, null, 2));
}

test();

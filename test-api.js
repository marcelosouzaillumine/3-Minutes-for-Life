import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseKey);

const selectQuery = `
  id,
  title,
  devotional_translations (
    language,
    title,
    status
  )
`;

async function run() {
  const { data, error } = await supabase
    .from('devotionals')
    .select(selectQuery)
    .eq('publication_date', '2026-08-18')
    .maybeSingle();
  console.log(JSON.stringify({data, error}, null, 2));
}

run();

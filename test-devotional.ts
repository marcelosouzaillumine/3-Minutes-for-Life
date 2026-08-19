import { supabase } from './src/lib/supabase';
import i18n from './src/i18n/config';
import { DevotionalService } from './src/services/DevotionalService';

async function run() {
  const selectQuery = `
  id,
  title,
  devotional_translations (
    id,
    language,
    status
  )
`;
  const { data, error } = await supabase.from('devotionals').select(selectQuery).limit(5);
  console.log("Data from DB:");
  console.log(JSON.stringify(data, null, 2));

  if (error) console.error("Error:", error);
}

run();

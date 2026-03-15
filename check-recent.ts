
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentData() {
  console.log("--- Generated Combines (Recent) ---");
  const { data: combines, error: cErr } = await supabase
    .from('generated_combines')
    .select('id, cache_key, total_odds, created_at')
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (cErr) console.error("Error fetching combines:", cErr);
  else console.log(combines);

  console.log("\n--- Combine Usage Log (Recent) ---");
  const { data: logs, error: lErr } = await supabase
    .from('combine_usage_log')
    .select('id, user_id, usage_type, user_tier, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  if (lErr) console.error("Error fetching logs:", lErr);
  else console.log(logs);
}

checkRecentData();

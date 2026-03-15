import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function checkCounts() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const today = new Date().toISOString().split('T')[0];
  
  const { count: profilesCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: predictionsToday } = await supabase.from('match_predictions').select('*', { count: 'exact', head: true }).gte('created_at', today);
  const { count: combinesToday } = await supabase.from('generated_combines').select('*', { count: 'exact', head: true }).gte('created_at', today);
  const { count: logCount } = await supabase.from('combine_usage_log').select('*', { count: 'exact', head: true });

  console.log('--- DB STATS ---');
  console.log('Total Profiles:', profilesCount);
  console.log('Predictions Generated Today:', predictionsToday);
  console.log('Combines Generated Today:', combinesToday);
  console.log('Total Combine Usage Logs:', logCount);
}

checkCounts();

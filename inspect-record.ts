
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRecord() {
  const { data, error } = await supabase
    .from('generated_combines')
    .select('*')
    .eq('id', 'd75c44c7-bcd0-4c1a-a353-e93c94a3792a')
    .single();
  
  if (error) console.error("Error:", error);
  else {
    console.log("--- RECORD INSPECTION ---");
    console.log("ID:", data.id);
    console.log("Total Odds:", data.total_odds);
    console.log("Matches Sample:", JSON.stringify(data.matches[0], null, 2));
    console.log("Matches Odds Sample:", JSON.stringify(data.matches[0]?.selection?.odds, null, 2));
    console.log("Full Parameters:", JSON.stringify(data.parameters, null, 2));
  }
}

inspectRecord();

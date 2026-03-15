
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const userId = '5e059027-7c1f-4a2e-aca3-fc78967f9ba2'; // Valid user ID from profiles
  console.log(`Testing insert into generated_combines with user_id: ${userId}`);
  
  const dummyCombine = {
    id: uuidv4(),
    cache_key: "test_cache_" + Math.random().toString(36).substring(7),
    parameters: { test: true },
    matches: [],
    total_odds: 10.5,
    estimated_probability: 50,
    analysis: { summary: "test", keyFactors: [], riskAssessment: "" },
    usage_count: 1,
    first_generated_by: userId,
    expires_at: new Date(Date.now() + 3600000).toISOString()
  };

  const { error } = await supabase.from('generated_combines').insert(dummyCombine);
  
  if (error) {
    console.error("Insert FAILED:", error);
  } else {
    console.log("Insert SUCCESSFUL");
    // Clean up
    await supabase.from('generated_combines').delete().eq('id', dummyCombine.id);
  }
}

testInsert();

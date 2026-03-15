
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  // We need to know the current user ID. 
  // Since I can't get it from the request here, I'll list all profiles to see if they are empty.
  const { data, count, error } = await supabase.from('profiles').select('id, email, tier', { count: 'exact' });
  console.log("Profiles count:", count);
  console.log("Profiles sample:", data);
  
  if (error) console.error("Error:", error);
}

checkUser();

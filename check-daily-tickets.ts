
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDailyTickets() {
  const { data, error } = await supabase
    .from('daily_ticket')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) console.error("Error:", error);
  else {
    console.log("--- RECENT DAILY TICKETS ---");
    data.forEach(t => {
      console.log(`Date: ${t.date}, ID: ${t.id}, Total Odds: ${t.total_odds}, Status: ${t.status}`);
      if (t.total_odds === null) {
        console.log("Full record for NULL odds:", JSON.stringify(t, null, 2));
      }
    });
  }
}

checkDailyTickets();

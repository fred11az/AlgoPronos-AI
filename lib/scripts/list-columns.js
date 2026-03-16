
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listColumns() {
  const { data, error } = await supabase.from('match_predictions').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('--- COLUMNS ---');
    Object.keys(data[0]).forEach(k => console.log(k));
  } else {
    console.log('Table is empty. Cannot determine columns via select.');
    const { data: cols } = await supabase.rpc('get_table_columns', { table_name: 'match_predictions' });
    if (cols) cols.forEach(k => console.log(k));
  }
}

listColumns();

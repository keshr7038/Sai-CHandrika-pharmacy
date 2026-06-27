const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://kxkkxciuzevywwynpibt.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_98noWkrwC-bkWfhJEPuurA_hrXDD0Ym';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = {
  supabase
};

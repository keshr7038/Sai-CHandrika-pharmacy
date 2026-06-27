import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxkkxciuzevywwynpibt.supabase.co';
const supabaseAnonKey = 'sb_publishable_98noWkrwC-bkWfhJEPuurA_hrXDD0Ym';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

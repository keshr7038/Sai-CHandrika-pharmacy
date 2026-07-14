import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hykohkdjkyrhrurvdoxy.supabase.co';
const supabaseAnonKey = 'sb_publishable_RcXAZIQkFLuyOztiwMUgZA_WugBQYdx';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

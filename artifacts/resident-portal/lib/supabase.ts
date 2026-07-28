import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://nwqigjkmlkwyyblgqppm.supabase.co';
const supabaseAnonKey = 'sb_publishable_Gscgjva4RQkFZfwANPpueg_rKfWJ_nU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

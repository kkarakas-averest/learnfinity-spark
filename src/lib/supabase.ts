
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error('Missing Supabase anonymous key. Please set VITE_SUPABASE_ANON_KEY in your environment variables.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

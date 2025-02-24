import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Don't persist the session
    storageKey: 'sb-auth-token',
    storage: window.localStorage,
    autoRefreshToken: false, // Don't auto refresh tokens
  },
  global: {
    headers: {
      'Prefer': 'count=exact,return=minimal'
    }
  },
  db: {
    schema: 'public'
  }
});
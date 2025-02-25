import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Persist the session in localStorage
    storageKey: 'sb-auth-token',
    storage: window.localStorage,
    autoRefreshToken: true, // Auto refresh tokens to maintain session
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
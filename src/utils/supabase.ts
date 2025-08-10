import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Safe storage access that works in SSR and various environments
const getStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  
  // Fallback storage for non-browser environments
  return {
    getItem: (key: string) => null,
    setItem: (key: string, value: string) => {},
    removeItem: (key: string) => {},
    clear: () => {},
    length: 0,
    key: (index: number) => null
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: typeof window !== 'undefined',
    detectSessionInUrl: typeof window !== 'undefined',
    flowType: 'pkce', // Use PKCE flow for better security
    debug: false
  },
  global: {
    headers: {
      'X-Client-Info': 'trasteros-web'
    }
  }
});

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};
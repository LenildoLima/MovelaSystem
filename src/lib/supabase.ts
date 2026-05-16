import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Helper to check if URL is valid
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

if (!supabaseUrl || !supabaseKey || !isValidUrl(supabaseUrl)) {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URL or Anon Key is missing in .env file.")
  } else {
    console.error("Supabase URL is invalid. Please check your .env file.")
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder'
)

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://tuxpcibcqljvamdzyhry.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1eHBjaWJjcWxqdmFtZHp5aHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NzI0NzksImV4cCI6MjA3OTE0ODQ3OX0.qFWW1mRcnkv97MGLNRlEv9en70zPdR_4_IWgMXo5TmE';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // We're not using auth yet
    autoRefreshToken: false,
  },
});

// Export URL for reference
export const SUPABASE_PROJECT_URL = SUPABASE_URL;

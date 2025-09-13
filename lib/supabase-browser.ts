import { createBrowserClient } from '@supabase/ssr'

// Use globalThis to persist across Fast Refresh
const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createBrowserClient> | undefined
}

export function getSupabaseBrowser() {
  if (!globalForSupabase.supabase) {
    // Use the correct Supabase instance
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvzswjyflmgenzxsrlwj.supabase.co'
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjQyNzcsImV4cCI6MjA3MDYwMDI3N30.TRJhRi8eTg4wJBqyGDx8Ui39Ap8gXhWULsLEWlaSM8g'
    
    globalForSupabase.supabase = createBrowserClient(
      url,
      key,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: 'shw-admin-auth', // Unique storage key for this app
        }
      }
    )
  }
  return globalForSupabase.supabase
}
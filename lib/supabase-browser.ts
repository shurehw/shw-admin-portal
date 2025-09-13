import { createBrowserClient } from '@supabase/ssr'

// Use globalThis to persist across Fast Refresh
const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createBrowserClient> | undefined
}

export function getSupabaseBrowser() {
  if (!globalForSupabase.supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables')
    }
    
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
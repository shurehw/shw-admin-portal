import { createBrowserClient } from '@supabase/ssr'

// Use globalThis to persist across Fast Refresh
const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createBrowserClient> | undefined
}

export function getSupabaseBrowser() {
  if (!globalForSupabase.supabase) {
    globalForSupabase.supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifyjjvbqmyyuhzpoxlsl.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeWpqdmJxbXl5dWh6cG94bHNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3OTUzMjksImV4cCI6MjA3MDM3MTMyOX0.yXS4pbap1yVfhidFCN4MZkZE4lbkF5yS9V-nR88V1kc',
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
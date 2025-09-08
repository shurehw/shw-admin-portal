import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Admin client with service role key (server-only)
export const supabaseAdmin = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables not configured');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
};

// User client with user's access token
export const supabaseUser = async () => {
  const cookieStore = cookies();
  const token = cookieStore.get('supabase-auth-token');
  
  if (!token) {
    throw new Error('No auth token found');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      },
      auth: {
        persistSession: false,
      },
    }
  );
};

// Browser client for client components
export const supabaseBrowser = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
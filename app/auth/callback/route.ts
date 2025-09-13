import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('Auth callback triggered');
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/admin/dashboard';
  
  console.log('Callback params:', { code: code ? 'present' : 'missing', next });

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              cookieStore.set(name, value)
            })
          },
        },
      }
    );
    
    try {
      console.log('Exchanging code for session...');
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(new URL(`/admin/login?error=auth&details=${error.message}`, requestUrl.origin));
      }
      console.log('Session created successfully');
    } catch (error: any) {
      console.error('Error in auth callback:', error);
      return NextResponse.redirect(new URL(`/admin/login?error=callback&details=${error.message}`, requestUrl.origin));
    }
  } else {
    console.log('No code in callback URL');
  }

  // URL to redirect to after sign in process completes
  console.log('Redirecting to:', next);
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
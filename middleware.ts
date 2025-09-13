import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: req,
  })

  // Create a Supabase client configured to use the server component's cookies
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('Missing Supabase environment variables in middleware')
    return supabaseResponse
  }
  
  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = req.nextUrl

  // Allow auth callback route
  if (pathname.startsWith('/auth/callback')) {
    return supabaseResponse
  }

  // Allow the login page, setup page, and test pages without a session
  if (pathname.startsWith('/admin/login') || 
      pathname.startsWith('/admin/setup') ||
      pathname.startsWith('/test-auth') || 
      pathname.startsWith('/admin/auth-debug')) {
    return supabaseResponse
  }

  // Gate all other /admin pages
  if (!user && pathname.startsWith('/admin')) {
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}


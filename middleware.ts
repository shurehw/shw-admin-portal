import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: req,
  })

  // Create a Supabase client configured to use the server component's cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvzswjyflmgenzxsrlwj.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjQyNzcsImV4cCI6MjA3MDYwMDI3N30.TRJhRi8eTg4wJBqyGDx8Ui39Ap8gXhWULsLEWlaSM8g',
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


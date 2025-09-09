import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Create a Supabase client to check/refresh the session
  const supabase = createMiddlewareClient({ req, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Allow the login page and test pages without a session
  if (pathname.startsWith('/admin/login') || 
      pathname.startsWith('/test-auth') || 
      pathname.startsWith('/admin/auth-debug')) {
    return res
  }

  // Gate all other /admin pages
  if (!session && pathname.startsWith('/admin')) {
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*'],
}


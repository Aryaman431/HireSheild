import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with cross-site tracking.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect routes based on user presence
  // E.g., redirect unauthenticated users to /login if they access /dashboard
  if (
    !user &&
    (request.nextUrl.pathname.startsWith('/dashboard') || 
     request.nextUrl.pathname.startsWith('/analyze') ||
     request.nextUrl.pathname.startsWith('/reports') ||
     request.nextUrl.pathname.startsWith('/history') ||
     request.nextUrl.pathname.startsWith('/profile'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from /login and /signup
  if (
    user && 
    (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

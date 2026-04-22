import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionJwt, COOKIE_NAME } from '@/lib/auth-session'

export async function middleware(request: NextRequest) {
  if (process.env.EDDIE_REQUIRE_LOGIN !== 'true') {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get(COOKIE_NAME)?.value
  const sub = await verifySessionJwt(token).catch(() => null)
  if (!sub) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp)$).*)'],
}

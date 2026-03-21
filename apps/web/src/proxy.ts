import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, computeSessionToken } from '@/lib/session'

export async function proxy(request: NextRequest) {
  const password = process.env['DASHBOARD_PASSWORD']
  if (!password) return NextResponse.next()

  const { pathname } = request.nextUrl

  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const cookie = request.cookies.get(SESSION_COOKIE)
  const expected = await computeSessionToken(password)
  if (cookie?.value === expected) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/login', request.url)
  if (pathname !== '/') loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|scissors\\.svg).*)'],
}

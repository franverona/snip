import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE_NAME = 'snip-auth'

export function GET(request: NextRequest) {
  const loginUrl = new URL('/login', request.url)
  const response = NextResponse.redirect(loginUrl)
  response.cookies.delete(COOKIE_NAME)
  return response
}

import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, computeSessionToken } from '@/lib/session'

export async function POST(request: NextRequest) {
  const password = process.env['DASHBOARD_PASSWORD']
  if (!password) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const provided = Buffer.from(body.password ?? '')
  const expected = Buffer.from(password)
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const token = await computeSessionToken(password)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
  return response
}

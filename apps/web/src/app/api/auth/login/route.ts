import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, computeSessionToken } from '@/lib/session'

const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60_000

interface RateLimitEntry {
  count: number
  resetAt: number
}

const attempts = new Map<string, RateLimitEntry>()

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

export function getRateLimitAttempts() {
  return attempts
}

export async function POST(request: NextRequest) {
  const password = process.env['DASHBOARD_PASSWORD']
  if (!password) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 404 })
  }

  const ip = getClientIp(request)
  const now = Date.now()
  const entry = attempts.get(ip)
  if (entry && now < entry.resetAt) {
    if (entry.count >= RATE_LIMIT_MAX) {
      return NextResponse.json({ error: 'Too many attempts, try again later' }, { status: 429 })
    }
    entry.count++
  } else {
    attempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
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

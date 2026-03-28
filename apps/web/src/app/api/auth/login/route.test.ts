import { beforeAll, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

function makeRequest(body: unknown, ip?: string) {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(ip ? { 'x-forwarded-for': ip } : {}),
    },
  })
}

describe('POST /api/auth/login — DASHBOARD_PASSWORD not configured', () => {
  let POST: (req: NextRequest) => Promise<Response>

  beforeAll(async () => {
    delete process.env['DASHBOARD_PASSWORD']
    vi.resetModules()
    const mod = await import('./route')
    POST = mod.POST
  })

  it('returns 404 with error message', async () => {
    const res = await POST(makeRequest({ password: 'anything' }))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Auth not configured')
  })
})

describe('POST /api/auth/login — DASHBOARD_PASSWORD configured', () => {
  let POST: (req: NextRequest) => Promise<Response>

  beforeAll(async () => {
    process.env['DASHBOARD_PASSWORD'] = 'secret123'
    vi.resetModules()
    const mod = await import('./route')
    POST = mod.POST
  })

  it('returns 401 for wrong password', async () => {
    const res = await POST(makeRequest({ password: 'wrong' }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Incorrect password')
  })

  it('returns 401 for malformed (non-JSON) body', async () => {
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'text/plain' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 200 and sets httpOnly session cookie for correct password', async () => {
    const res = await POST(makeRequest({ password: 'secret123' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)

    const cookie = res.headers.get('set-cookie')
    expect(cookie).toMatch(/snip-auth=/)
    expect(cookie).toMatch(/HttpOnly/i)
  })

  it('cookie value is a 64-char hex string (SHA-256)', async () => {
    const res = await POST(makeRequest({ password: 'secret123' }))
    const cookie = res.headers.get('set-cookie') ?? ''
    const match = cookie.match(/snip-auth=([0-9a-f]+)/)
    expect(match).not.toBeNull()
    expect(match![1]).toHaveLength(64)
  })

  it('same password always produces the same session token', async () => {
    const res1 = await POST(makeRequest({ password: 'secret123' }, '10.0.0.1'))
    const res2 = await POST(makeRequest({ password: 'secret123' }, '10.0.0.2'))
    const token1 = (res1.headers.get('set-cookie') ?? '').match(/snip-auth=([^;]+)/)?.[1]
    const token2 = (res2.headers.get('set-cookie') ?? '').match(/snip-auth=([^;]+)/)?.[1]
    expect(token1).toBe(token2)
  })
})

describe('POST /api/auth/login — rate limiting', () => {
  let POST: (req: NextRequest) => Promise<Response>
  let getRateLimitAttempts: () => Map<string, { count: number; resetAt: number }>

  beforeAll(async () => {
    process.env['DASHBOARD_PASSWORD'] = 'secret123'
    vi.resetModules()
    const mod = await import('./route')
    POST = mod.POST
    getRateLimitAttempts = mod.getRateLimitAttempts
  })

  it('allows requests below the limit', async () => {
    const ip = '192.168.1.1'
    getRateLimitAttempts().delete(ip)
    const res = await POST(makeRequest({ password: 'wrong' }, ip))
    expect(res.status).toBe(401)
  })

  it('returns 429 after exceeding the limit', async () => {
    const ip = '192.168.1.2'
    getRateLimitAttempts().delete(ip)
    // exhaust the limit
    for (let i = 0; i < 10; i++) {
      await POST(makeRequest({ password: 'wrong' }, ip))
    }
    const res = await POST(makeRequest({ password: 'wrong' }, ip))
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toBe('Too many attempts, try again later')
  })

  it('does not count against a different IP', async () => {
    const blockedIp = '192.168.1.3'
    const otherIp = '192.168.1.4'
    getRateLimitAttempts().delete(blockedIp)
    getRateLimitAttempts().delete(otherIp)
    for (let i = 0; i < 10; i++) {
      await POST(makeRequest({ password: 'wrong' }, blockedIp))
    }
    const res = await POST(makeRequest({ password: 'wrong' }, otherIp))
    expect(res.status).toBe(401)
  })

  it('resets after the window expires', async () => {
    const ip = '192.168.1.5'
    getRateLimitAttempts().set(ip, { count: 10, resetAt: Date.now() - 1 })
    const res = await POST(makeRequest({ password: 'wrong' }, ip))
    expect(res.status).toBe(401)
  })
})

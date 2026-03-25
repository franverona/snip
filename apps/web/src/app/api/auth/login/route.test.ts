import { beforeAll, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
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
    const res1 = await POST(makeRequest({ password: 'secret123' }))
    const res2 = await POST(makeRequest({ password: 'secret123' }))
    const token1 = (res1.headers.get('set-cookie') ?? '').match(/snip-auth=([^;]+)/)?.[1]
    const token2 = (res2.headers.get('set-cookie') ?? '').match(/snip-auth=([^;]+)/)?.[1]
    expect(token1).toBe(token2)
  })
})

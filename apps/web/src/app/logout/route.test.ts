import { beforeAll, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

describe('GET /logout', () => {
  let GET: (req: NextRequest) => Response

  beforeAll(async () => {
    vi.resetModules()
    const mod = await import('./route')
    GET = mod.GET
  })

  it('redirects to /login', () => {
    const req = new NextRequest('http://localhost:3000/logout')
    const res = GET(req)
    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.status).toBeLessThan(400)
    expect(res.headers.get('location')).toBe('http://localhost:3000/login')
  })

  it('clears the snip-auth cookie', () => {
    const req = new NextRequest('http://localhost:3000/logout')
    const res = GET(req)
    const cookie = res.headers.get('set-cookie') ?? ''
    expect(cookie).toMatch(/snip-auth=/)
  })
})

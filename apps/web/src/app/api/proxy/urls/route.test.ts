import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

afterEach(() => {
  vi.unstubAllGlobals()
})

// Each describe block uses a fresh module loaded with specific env vars.
// vi.resetModules() + dynamic import is required because the route reads env vars at module load time.

describe('POST /api/proxy/urls — with API_KEY', () => {
  let POST: (req: NextRequest) => Promise<Response>
  let DELETE: (req: NextRequest) => Promise<Response>

  beforeAll(async () => {
    process.env['API_URL'] = 'http://localhost:3001'
    process.env['API_KEY'] = 'test-key'
    vi.resetModules()
    const mod = await import('./route')
    POST = mod.POST
    DELETE = mod.DELETE
  })

  it('forwards the request body to the API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 201,
      json: async () => ({
        slug: 'abc',
        shortUrl: 'http://localhost:3001/abc',
        originalUrl: 'https://example.com',
        existing: false,
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const req = new NextRequest('http://localhost/api/proxy/urls', {
      method: 'POST',
      body: JSON.stringify({ originalUrl: 'https://example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)

    expect(res.status).toBe(201)
    const [url, init] = mockFetch.mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string> },
    ]
    expect(url).toBe('http://localhost:3001/urls')
    expect(init.method).toBe('POST')
    expect(init.headers['Authorization']).toBe('Bearer test-key')
  })

  it('passes through API error status and body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 422,
        json: async () => ({ error: 'Invalid URL' }),
      }),
    )

    const req = new NextRequest('http://localhost/api/proxy/urls', {
      method: 'POST',
      body: JSON.stringify({ originalUrl: 'not-a-url' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error).toBe('Invalid URL')
  })

  it('DELETE bulk forwards slugs with Authorization header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ deleted: 2 }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const req = new NextRequest('http://localhost/api/proxy/urls', {
      method: 'DELETE',
      body: JSON.stringify({ slugs: ['abc', 'def'] }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await DELETE(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.deleted).toBe(2)

    const [url, init] = mockFetch.mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string> },
    ]
    expect(url).toBe('http://localhost:3001/urls')
    expect(init.method).toBe('DELETE')
    expect(init.headers['Authorization']).toBe('Bearer test-key')
  })
})

describe('POST /api/proxy/urls — without API_KEY', () => {
  let POST: (req: NextRequest) => Promise<Response>

  beforeAll(async () => {
    process.env['API_URL'] = 'http://localhost:3001'
    delete process.env['API_KEY']
    vi.resetModules()
    const mod = await import('./route')
    POST = mod.POST
  })

  it('does not include an Authorization header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 201,
      json: async () => ({
        slug: 'abc',
        shortUrl: 'http://localhost:3001/abc',
        originalUrl: 'https://example.com',
        existing: false,
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const req = new NextRequest('http://localhost/api/proxy/urls', {
      method: 'POST',
      body: JSON.stringify({ originalUrl: 'https://example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })

    await POST(req)
    const [, init] = mockFetch.mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string> },
    ]
    expect(init.headers['Authorization']).toBeUndefined()
  })
})

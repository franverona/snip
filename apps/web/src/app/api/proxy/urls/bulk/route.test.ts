import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

afterEach(() => {
  vi.unstubAllGlobals()
})

function makeRequest(body: unknown, extraHeaders: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/proxy/urls/bulk', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  })
}

describe('POST /api/proxy/urls/bulk — with API_KEY', () => {
  let POST: (req: NextRequest) => Promise<Response>

  beforeAll(async () => {
    process.env['API_URL'] = 'http://localhost:3001'
    process.env['API_KEY'] = 'test-key'
    vi.resetModules()
    const mod = await import('./route')
    POST = mod.POST
  })

  it('forwards the body to the API with an Authorization header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ results: [{ success: true, slug: 'abc' }] }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const res = await POST(makeRequest({ urls: [{ originalUrl: 'https://example.com' }] }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.results).toHaveLength(1)

    const [url, init] = mockFetch.mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string> },
    ]
    expect(url).toBe('http://localhost:3001/urls/bulk')
    expect(init.method).toBe('POST')
    expect(init.headers['Authorization']).toBe('Bearer test-key')
  })

  it('passes through API error status and body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 400,
        json: async () => ({ error: 'Validation error' }),
      }),
    )

    const res = await POST(makeRequest({ urls: [] }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Validation error')
  })

  it('returns 413 when Content-Length exceeds 1 MB', async () => {
    const res = await POST(
      makeRequest(
        { urls: [{ originalUrl: 'https://example.com' }] },
        { 'Content-Length': '1048577' },
      ),
    )

    expect(res.status).toBe(413)
    const body = await res.json()
    expect(body.error).toBe('Request body too large')
  })
})

describe('POST /api/proxy/urls/bulk — without API_KEY', () => {
  let POST: (req: NextRequest) => Promise<Response>

  beforeAll(async () => {
    process.env['API_URL'] = 'http://localhost:3001'
    delete process.env['API_KEY']
    vi.resetModules()
    const mod = await import('./route')
    POST = mod.POST
  })

  it('does not include Authorization header', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue({ status: 200, json: async () => ({ results: [] }) })
    vi.stubGlobal('fetch', mockFetch)

    await POST(makeRequest({ urls: [{ originalUrl: 'https://example.com' }] }))

    const [, init] = mockFetch.mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string> },
    ]
    expect(init.headers['Authorization']).toBeUndefined()
  })
})

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('DELETE /api/proxy/urls/[slug]', () => {
  let DELETE: (req: Request, ctx: { params: Promise<{ slug: string }> }) => Promise<Response>

  beforeAll(async () => {
    process.env['API_URL'] = 'http://localhost:3001'
    process.env['API_KEY'] = 'test-key'
    vi.resetModules()
    const mod = await import('./route')
    DELETE = mod.DELETE
  })

  it('returns 204 with no body when API returns 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 204 }))

    const res = await DELETE(new Request('http://localhost'), {
      params: Promise.resolve({ slug: 'abc' }),
    })

    expect(res.status).toBe(204)
    expect(res.body).toBeNull()
  })

  it('calls the correct API URL and includes Authorization header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 204 })
    vi.stubGlobal('fetch', mockFetch)

    await DELETE(new Request('http://localhost'), {
      params: Promise.resolve({ slug: 'my-slug' }),
    })

    const [url, init] = mockFetch.mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string> },
    ]
    expect(url).toBe('http://localhost:3001/urls/my-slug')
    expect(init.method).toBe('DELETE')
    expect(init.headers['Authorization']).toBe('Bearer test-key')
  })

  it('passes through API error status and body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 404,
        json: async () => ({ error: 'Not found' }),
      }),
    )

    const res = await DELETE(new Request('http://localhost'), {
      params: Promise.resolve({ slug: 'unknown' }),
    })

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Not found')
  })
})

describe('DELETE /api/proxy/urls/[slug] — without API_KEY', () => {
  let DELETE: (req: Request, ctx: { params: Promise<{ slug: string }> }) => Promise<Response>

  beforeAll(async () => {
    process.env['API_URL'] = 'http://localhost:3001'
    delete process.env['API_KEY']
    vi.resetModules()
    const mod = await import('./route')
    DELETE = mod.DELETE
  })

  it('does not include Authorization header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 204 })
    vi.stubGlobal('fetch', mockFetch)

    await DELETE(new Request('http://localhost'), {
      params: Promise.resolve({ slug: 'abc' }),
    })

    const [, init] = mockFetch.mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string> },
    ]
    expect(init.headers['Authorization']).toBeUndefined()
  })
})

function makePatchRequest(body: unknown, extraHeaders: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/proxy/urls/abc', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  })
}

describe('PATCH /api/proxy/urls/[slug]', () => {
  let PATCH: (req: NextRequest, ctx: { params: Promise<{ slug: string }> }) => Promise<Response>

  beforeAll(async () => {
    process.env['API_URL'] = 'http://localhost:3001'
    process.env['API_KEY'] = 'test-key'
    vi.resetModules()
    const mod = await import('./route')
    PATCH = mod.PATCH
  })

  it('forwards the body to the API with an Authorization header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ slug: 'abc', title: 'New title' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const res = await PATCH(makePatchRequest({ title: 'New title' }), {
      params: Promise.resolve({ slug: 'abc' }),
    })

    expect(res.status).toBe(200)
    const [url, init] = mockFetch.mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string>; body: string },
    ]
    expect(url).toBe('http://localhost:3001/urls/abc')
    expect(init.method).toBe('PATCH')
    expect(init.headers['Authorization']).toBe('Bearer test-key')
    expect(init.body).toBe(JSON.stringify({ title: 'New title' }))
  })

  it('passes through API error status and body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 404, json: async () => ({ error: 'URL not found' }) }),
    )

    const res = await PATCH(makePatchRequest({ title: 'New title' }), {
      params: Promise.resolve({ slug: 'unknown' }),
    })

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('URL not found')
  })

  it('returns 413 when Content-Length exceeds 1 MB', async () => {
    const res = await PATCH(makePatchRequest({ title: 'x' }, { 'Content-Length': '1048577' }), {
      params: Promise.resolve({ slug: 'abc' }),
    })

    expect(res.status).toBe(413)
    const body = await res.json()
    expect(body.error).toBe('Request body too large')
  })
})

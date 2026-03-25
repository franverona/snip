import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import { redirectRoutes } from './redirect.js'

vi.mock('../services/url.service.js', () => ({
  findUrlBySlug: vi.fn(),
  recordClick: vi.fn(),
}))

vi.mock('../db/client.js')

import { findUrlBySlug, recordClick } from '../services/url.service.js'

const mockUrlRow = {
  id: 'uuid-1',
  slug: 'abc12345',
  originalUrl: 'https://example.com',
  title: 'Example Domain',
  description: null,
  customSlug: false,
  expiresAt: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
}

let app: FastifyInstance

beforeEach(async () => {
  vi.clearAllMocks()
  vi.mocked(recordClick).mockResolvedValue(undefined)
  app = Fastify({ logger: false })
  await app.register(redirectRoutes)
})

afterEach(async () => {
  await app.close()
})

describe('GET /:slug', () => {
  it('returns 200 with OG meta tags and client-side redirect', async () => {
    vi.mocked(findUrlBySlug).mockResolvedValue(mockUrlRow)

    const res = await app.inject({
      method: 'GET',
      url: '/abc12345',
      headers: { 'user-agent': 'TestAgent/1.0', referer: 'https://referrer.com' },
    })

    // Flush setImmediate so the fire-and-forget recordClick executes
    await new Promise((resolve) => setImmediate(resolve))

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/html/)
    expect(res.headers['cache-control']).toBe('public, max-age=3600')
    expect(res.body).toContain('og:url')
    expect(res.body).toContain('https://example.com')
    expect(res.body).toContain('og:title')
    expect(res.body).toContain('Example Domain')
    expect(res.body).toContain('http-equiv="refresh"')
    expect(res.body).toContain('location.replace(')
    expect(vi.mocked(recordClick)).toHaveBeenCalledOnce()
    expect(vi.mocked(recordClick)).toHaveBeenCalledWith(
      'uuid-1',
      expect.objectContaining({ userAgent: 'TestAgent/1.0', referer: 'https://referrer.com' }),
    )
  })

  it('uses the original URL as og:title when no title is stored', async () => {
    vi.mocked(findUrlBySlug).mockResolvedValue({ ...mockUrlRow, title: null })

    const res = await app.inject({ method: 'GET', url: '/abc12345' })

    expect(res.statusCode).toBe(200)
    // title falls back to originalUrl
    const titleMatch = res.body.match(/og:title" content="([^"]+)"/)
    expect(titleMatch?.[1]).toBe('https://example.com')
  })

  it('includes og:description when description is stored', async () => {
    vi.mocked(findUrlBySlug).mockResolvedValue({
      ...mockUrlRow,
      description: 'A great example page',
    })

    const res = await app.inject({ method: 'GET', url: '/abc12345' })

    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('og:description')
    expect(res.body).toContain('A great example page')
  })

  it('returns 404 for an unknown slug', async () => {
    vi.mocked(findUrlBySlug).mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/notexist' })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('URL not found')
  })

  it('returns 410 for an expired URL', async () => {
    vi.mocked(findUrlBySlug).mockResolvedValue({
      ...mockUrlRow,
      expiresAt: new Date('2020-01-01T00:00:00Z'),
    })

    const res = await app.inject({ method: 'GET', url: '/abc12345' })

    expect(res.statusCode).toBe(410)
    expect(res.headers['cache-control']).toBe('public, max-age=60')
    expect(res.json().error).toBe('URL has expired')
  })

  it('serves OG page with no-store cache for a URL with a future expiry date', async () => {
    vi.mocked(findUrlBySlug).mockResolvedValue({
      ...mockUrlRow,
      expiresAt: new Date('2099-01-01T00:00:00Z'),
    })

    const res = await app.inject({ method: 'GET', url: '/abc12345' })

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/html/)
    expect(res.headers['cache-control']).toBe('no-store')
  })

  it('escapes HTML special characters in meta tag values', async () => {
    vi.mocked(findUrlBySlug).mockResolvedValue({
      ...mockUrlRow,
      title: 'Hello <World> & "Friends"',
    })

    const res = await app.inject({ method: 'GET', url: '/abc12345' })

    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('Hello &lt;World&gt; &amp; &quot;Friends&quot;')
    expect(res.body).not.toContain('<World>')
  })

  it('still returns 200 when click recording throws (fire-and-forget contract)', async () => {
    vi.mocked(findUrlBySlug).mockResolvedValue(mockUrlRow)
    vi.mocked(recordClick).mockRejectedValue(new Error('DB error'))

    const res = await app.inject({ method: 'GET', url: '/abc12345' })

    // Flush setImmediate so the fire-and-forget recordClick executes
    await new Promise((resolve) => setImmediate(resolve))

    expect(res.statusCode).toBe(200)
  })
})

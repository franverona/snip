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
  it('redirects to the original URL with 302', async () => {
    vi.mocked(findUrlBySlug).mockResolvedValue(mockUrlRow)

    const res = await app.inject({
      method: 'GET',
      url: '/abc12345',
      headers: { 'user-agent': 'TestAgent/1.0', referer: 'https://referrer.com' },
    })

    // Flush setImmediate so the fire-and-forget recordClick executes
    await new Promise((resolve) => setImmediate(resolve))

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('https://example.com')
    expect(vi.mocked(recordClick)).toHaveBeenCalledOnce()
    expect(vi.mocked(recordClick)).toHaveBeenCalledWith(
      'uuid-1',
      expect.objectContaining({ userAgent: 'TestAgent/1.0', referer: 'https://referrer.com' }),
    )
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
    expect(res.json().error).toBe('URL has expired')
  })

  it('redirects normally for a URL with a future expiry date', async () => {
    vi.mocked(findUrlBySlug).mockResolvedValue({
      ...mockUrlRow,
      expiresAt: new Date('2099-01-01T00:00:00Z'),
    })

    const res = await app.inject({ method: 'GET', url: '/abc12345' })

    expect(res.statusCode).toBe(302)
  })
})

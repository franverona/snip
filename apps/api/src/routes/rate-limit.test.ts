import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { urlRoutes } from './urls.js'

vi.mock('../config.js', () => ({
  env: {
    BASE_URL: 'http://localhost:3001',
    RATE_LIMIT_CREATE_PER_MINUTE: 2,
    API_KEY: undefined as string | undefined,
  },
}))

vi.mock('../services/url.service.js', () => ({
  getUrlList: vi.fn(),
  createUrl: vi.fn(),
  getUrlStats: vi.fn(),
  deleteUrl: vi.fn(),
  getUrlPreview: vi.fn(),
}))

vi.mock('../db/client.js')

vi.mock('../lib/pagination.js', () => ({
  parsePagination: vi.fn(() => ({ page: 1, perPage: 20, offset: 0 })),
  totalPages: vi.fn(() => 1),
}))

import { createUrl, getUrlList } from '../services/url.service.js'

const mockUrlResult = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'abc12345',
  originalUrl: 'https://example.com',
  customSlug: false,
  title: null,
  description: null,
  expiresAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  shortUrl: 'http://localhost:3001/abc12345',
}

describe('Rate limiting — POST /urls per-route limit', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(createUrl).mockResolvedValue(mockUrlResult)
    app = Fastify({ logger: false })
    await app.register(rateLimit, { global: false })
    await app.register(urlRoutes)
  })

  afterEach(async () => {
    await app.close()
  })

  it('allows requests up to RATE_LIMIT_CREATE_PER_MINUTE and returns 429 on the next', async () => {
    const LIMIT = 2 // matches mocked RATE_LIMIT_CREATE_PER_MINUTE

    for (let i = 0; i < LIMIT; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/urls',
        payload: { originalUrl: 'https://example.com' },
      })
      expect(res.statusCode).toBe(201)
    }

    const res = await app.inject({
      method: 'POST',
      url: '/urls',
      payload: { originalUrl: 'https://example.com' },
    })

    expect(res.statusCode).toBe(429)
  })

  it('includes a Retry-After header on the 429 response', async () => {
    const LIMIT = 2

    for (let i = 0; i < LIMIT; i++) {
      await app.inject({
        method: 'POST',
        url: '/urls',
        payload: { originalUrl: 'https://example.com' },
      })
    }

    const res = await app.inject({
      method: 'POST',
      url: '/urls',
      payload: { originalUrl: 'https://example.com' },
    })

    expect(res.statusCode).toBe(429)
    expect(res.headers['retry-after']).toBeDefined()
  })
})

describe('Rate limiting — global limit', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(getUrlList).mockResolvedValue({
      data: [],
      meta: { page: 1, perPage: 20, total: 0, totalPages: 0 },
    })
    app = Fastify({ logger: false })
    await app.register(rateLimit, { global: true, max: 2, timeWindow: '1 minute' })
    await app.register(urlRoutes)
  })

  afterEach(async () => {
    await app.close()
  })

  it('returns 429 on GET /urls after exceeding the global limit', async () => {
    const LIMIT = 2

    for (let i = 0; i < LIMIT; i++) {
      const res = await app.inject({ method: 'GET', url: '/urls' })
      expect(res.statusCode).toBe(200)
    }

    const res = await app.inject({ method: 'GET', url: '/urls' })
    expect(res.statusCode).toBe(429)
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { urlRoutes } from './urls.js'

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

import {
  createUrl,
  getUrlStats,
  deleteUrl,
  getUrlList,
  getUrlPreview,
} from '../services/url.service.js'
import { parsePagination } from '../lib/pagination.js'

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

const mockUrlRecord = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'abc12345',
  originalUrl: 'https://example.com',
  customSlug: false,
  title: null,
  description: null,
  expiresAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
}

let app: FastifyInstance

beforeEach(async () => {
  vi.clearAllMocks()
  app = Fastify({ logger: false })
  await app.register(rateLimit, { global: false })
  await app.register(urlRoutes)
})

afterEach(async () => {
  await app.close()
})

describe('GET /urls', () => {
  it('returns 200 with list without query params', async () => {
    vi.mocked(getUrlList).mockResolvedValue({
      data: [mockUrlRecord],
      meta: {
        page: 1,
        perPage: 20,
        total: 1,
        totalPages: 1,
      },
    })

    const res = await app.inject({ method: 'GET', url: '/urls' })

    expect(res.statusCode).toBe(200)
    expect(parsePagination).toHaveBeenCalledWith({})
    expect(res.json().meta).toEqual({
      page: 1,
      perPage: 20,
      total: 1,
      totalPages: 1,
    })
  })

  it('returns 200 with list with query params', async () => {
    vi.mocked(getUrlList).mockResolvedValue({
      data: [mockUrlRecord],
      meta: {
        page: 1,
        perPage: 20,
        total: 1,
        totalPages: 1,
      },
    })

    const res = await app.inject({ method: 'GET', url: '/urls?page=2&perPage=10' })

    expect(res.statusCode).toBe(200)
    expect(parsePagination).toHaveBeenCalledWith({ page: 2, perPage: 10 })
    expect(res.json().meta).toEqual({
      page: 1,
      perPage: 20,
      total: 1,
      totalPages: 1,
    })
  })
})

describe('POST /urls', () => {
  it('returns 201 with the created short URL', async () => {
    vi.mocked(createUrl).mockResolvedValue(mockUrlResult)

    const res = await app.inject({
      method: 'POST',
      url: '/urls',
      payload: { originalUrl: 'https://example.com' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().shortUrl).toBe('http://localhost:3001/abc12345')
  })

  it('returns 400 for an invalid request body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/urls',
      payload: { originalUrl: 'not-a-url' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Validation error')
  })

  it('returns 400 for missing body', async () => {
    const res = await app.inject({ method: 'POST', url: '/urls', payload: {} })

    expect(res.statusCode).toBe(400)
  })

  it('returns 400 for REDIRECT_LOOP', async () => {
    vi.mocked(createUrl).mockRejectedValue(new Error('REDIRECT_LOOP'))

    const res = await app.inject({
      method: 'POST',
      url: '/urls',
      payload: { originalUrl: 'https://example.com' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toMatch(/service/i)
  })

  it('returns 409 for SLUG_TAKEN', async () => {
    vi.mocked(createUrl).mockRejectedValue(new Error('SLUG_TAKEN'))

    const res = await app.inject({
      method: 'POST',
      url: '/urls',
      payload: { originalUrl: 'https://example.com' },
    })

    expect(res.statusCode).toBe(409)
    expect(res.json().error).toBe('Slug already taken')
  })

  it('returns 422 for UNRESOLVED_DNS', async () => {
    vi.mocked(createUrl).mockRejectedValue(new Error('UNRESOLVED_DNS'))

    const res = await app.inject({
      method: 'POST',
      url: '/urls',
      payload: { originalUrl: 'https://example.com' },
    })

    expect(res.statusCode).toBe(422)
    expect(res.json().error).toMatch(/hostname/i)
  })

  it('returns 400 for PRIVATE_ADDRESS', async () => {
    vi.mocked(createUrl).mockRejectedValue(new Error('PRIVATE_ADDRESS'))

    const res = await app.inject({
      method: 'POST',
      url: '/urls',
      payload: { originalUrl: 'https://example.com' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toMatch(/private/i)
  })

  it('propagates unexpected errors as 500', async () => {
    vi.mocked(createUrl).mockRejectedValue(new Error('Unexpected DB error'))

    const res = await app.inject({
      method: 'POST',
      url: '/urls',
      payload: { originalUrl: 'https://example.com' },
    })

    expect(res.statusCode).toBe(500)
  })
})

describe('GET /urls/:slug/stats', () => {
  it('returns 200 with stats', async () => {
    vi.mocked(getUrlStats).mockResolvedValue({
      url: mockUrlResult,
      totalClicks: 10,
      clicksByDay: [],
      clicksLast24h: 2,
      clicksLast7d: 5,
      recentClicks: [],
    })

    const res = await app.inject({ method: 'GET', url: '/urls/abc12345/stats' })

    expect(res.statusCode).toBe(200)
    expect(res.json().totalClicks).toBe(10)
  })

  it('returns 404 when slug does not exist', async () => {
    vi.mocked(getUrlStats).mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/urls/notexist/stats' })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('URL not found')
  })
})

describe('DELETE /urls/:slug', () => {
  it('returns 204 when the URL is deleted', async () => {
    vi.mocked(deleteUrl).mockResolvedValue(true)

    const res = await app.inject({ method: 'DELETE', url: '/urls/abc12345' })

    expect(res.statusCode).toBe(204)
  })

  it('returns 404 when the URL does not exist', async () => {
    vi.mocked(deleteUrl).mockResolvedValue(false)

    const res = await app.inject({ method: 'DELETE', url: '/urls/notexist' })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('URL not found')
  })
})

describe('GET /preview/:slug', () => {
  it('returns 200 with preview', async () => {
    vi.mocked(getUrlPreview).mockResolvedValue(mockUrlRecord)

    const res = await app.inject({ method: 'GET', url: '/preview/abc12345' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual(mockUrlRecord)
  })

  it('returns 404 if not found', async () => {
    vi.mocked(getUrlPreview).mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/preview/abc12345' })

    expect(res.statusCode).toBe(404)
  })

  it('returns 410 if expired', async () => {
    vi.mocked(getUrlPreview).mockRejectedValue(new Error('EXPIRED'))

    const res = await app.inject({ method: 'GET', url: '/preview/abc12345' })

    expect(res.statusCode).toBe(410)
  })

  it('propagates unexpected errors as 500', async () => {
    vi.mocked(getUrlPreview).mockRejectedValue(new Error('Unexpected DB error'))

    const res = await app.inject({ method: 'GET', url: '/preview/abc12345' })

    expect(res.statusCode).toBe(500)
  })
})

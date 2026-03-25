import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { urlRoutes } from './urls.js'

vi.mock('../config.js', () => ({
  env: {
    BASE_URL: 'http://localhost:3001',
    RATE_LIMIT_CREATE_PER_MINUTE: 10,
    RATE_LIMIT_BULK_DELETE_PER_MINUTE: 20,
    API_KEY: undefined as string | undefined,
  },
}))

vi.mock('../services/url.service.js', async () => {
  const actual = await vi.importActual('../services/url.service.js')
  return {
    ...(actual as Record<string, unknown>),
    getUrlList: vi.fn(),
    createUrl: vi.fn(),
    getUrlStats: vi.fn(),
    deleteUrl: vi.fn(),
    deleteUrls: vi.fn(),
    getUrlPreview: vi.fn(),
  }
})

vi.mock('../db/client.js')

vi.mock('../lib/pagination.js', () => ({
  parsePagination: vi.fn(() => ({ page: 1, perPage: 20, offset: 0 })),
  totalPages: vi.fn(() => 1),
}))

import {
  createUrl,
  getUrlStats,
  deleteUrl,
  deleteUrls,
  getUrlList,
  getUrlPreview,
  UrlFetchError,
} from '../services/url.service.js'
import { parsePagination } from '../lib/pagination.js'
import { env } from '../config.js'

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

  it('passes q param to getUrlList when provided', async () => {
    vi.mocked(getUrlList).mockResolvedValue({
      data: [mockUrlRecord],
      meta: { page: 1, perPage: 20, total: 1, totalPages: 1 },
    })

    const res = await app.inject({ method: 'GET', url: '/urls?q=example' })

    expect(res.statusCode).toBe(200)
    expect(getUrlList).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      'example',
    )
  })

  it('returns empty results when q matches nothing', async () => {
    vi.mocked(getUrlList).mockResolvedValue({
      data: [],
      meta: { page: 1, perPage: 20, total: 0, totalPages: 0 },
    })

    const res = await app.inject({ method: 'GET', url: '/urls?q=nomatch' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toEqual([])
    expect(res.json().meta.total).toBe(0)
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
    vi.mocked(createUrl).mockRejectedValue(new UrlFetchError('REDIRECT_LOOP'))

    const res = await app.inject({
      method: 'POST',
      url: '/urls',
      payload: { originalUrl: 'https://example.com' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toMatch(/service/i)
  })

  it('returns 409 for SLUG_TAKEN', async () => {
    vi.mocked(createUrl).mockRejectedValue(new UrlFetchError('SLUG_TAKEN'))

    const res = await app.inject({
      method: 'POST',
      url: '/urls',
      payload: { originalUrl: 'https://example.com' },
    })

    expect(res.statusCode).toBe(409)
    expect(res.json().error).toBe('Slug already taken')
  })

  it('returns 422 for UNRESOLVED_DNS', async () => {
    vi.mocked(createUrl).mockRejectedValue(new UrlFetchError('UNRESOLVED_DNS'))

    const res = await app.inject({
      method: 'POST',
      url: '/urls',
      payload: { originalUrl: 'https://example.com' },
    })

    expect(res.statusCode).toBe(422)
    expect(res.json().error).toMatch(/hostname/i)
  })

  it('returns 400 for PRIVATE_ADDRESS', async () => {
    vi.mocked(createUrl).mockRejectedValue(new UrlFetchError('PRIVATE_ADDRESS'))

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

  it('returns 200 with existing:true when URL already exists', async () => {
    vi.mocked(createUrl).mockResolvedValue({ ...mockUrlResult, existing: true })

    const res = await app.inject({
      method: 'POST',
      url: '/urls',
      payload: { originalUrl: 'https://example.com' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().existing).toBe(true)
    expect(res.json().shortUrl).toBe('http://localhost:3001/abc12345')
  })

  it('returns 201 and creates new URL when allowDuplicate is true', async () => {
    vi.mocked(createUrl).mockResolvedValue(mockUrlResult)

    const res = await app.inject({
      method: 'POST',
      url: '/urls',
      payload: { originalUrl: 'https://example.com', allowDuplicate: true },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().existing).toBeUndefined()
  })

  it('accepts optional title and description fields', async () => {
    vi.mocked(createUrl).mockResolvedValue({
      ...mockUrlResult,
      title: 'My Title',
      description: 'My desc',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/urls',
      payload: { originalUrl: 'https://example.com', title: 'My Title', description: 'My desc' },
    })

    expect(res.statusCode).toBe(201)
    expect(createUrl).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'My Title', description: 'My desc' }),
      expect.any(String),
    )
  })

  it('returns 400 when title exceeds 200 characters', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/urls',
      payload: { originalUrl: 'https://example.com', title: 'a'.repeat(201) },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Validation error')
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
      referrers: [],
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

describe('DELETE /urls', () => {
  it('returns 200 with deleted count', async () => {
    vi.mocked(deleteUrls).mockResolvedValue({ deleted: 2 })

    const res = await app.inject({
      method: 'DELETE',
      url: '/urls',
      payload: { slugs: ['abc12345', 'xyz98765'] },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().deleted).toBe(2)
    expect(deleteUrls).toHaveBeenCalledWith(['abc12345', 'xyz98765'])
  })

  it('returns 400 for missing slugs', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/urls', payload: {} })

    expect(res.statusCode).toBe(400)
  })

  it('returns 400 for empty slugs array', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/urls',
      payload: { slugs: [] },
    })

    expect(res.statusCode).toBe(400)
  })

  it('returns 0 deleted when no slugs match', async () => {
    vi.mocked(deleteUrls).mockResolvedValue({ deleted: 0 })

    const res = await app.inject({
      method: 'DELETE',
      url: '/urls',
      payload: { slugs: ['notexist'] },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().deleted).toBe(0)
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
    vi.mocked(getUrlPreview).mockRejectedValue(new UrlFetchError('EXPIRED'))

    const res = await app.inject({ method: 'GET', url: '/preview/abc12345' })

    expect(res.statusCode).toBe(410)
  })

  it('propagates unexpected errors as 500', async () => {
    vi.mocked(getUrlPreview).mockRejectedValue(new Error('Unexpected DB error'))

    const res = await app.inject({ method: 'GET', url: '/preview/abc12345' })

    expect(res.statusCode).toBe(500)
  })
})

describe('API_KEY enforcement', () => {
  beforeEach(() => {
    ;(env as { API_KEY: string | undefined }).API_KEY = 'test-api-key'
  })

  afterEach(() => {
    ;(env as { API_KEY: string | undefined }).API_KEY = undefined
  })

  describe('POST /urls', () => {
    it('returns 401 when API_KEY is set and no Authorization header is provided', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/urls',
        payload: { originalUrl: 'https://example.com' },
      })

      expect(res.statusCode).toBe(401)
      expect(res.json().error).toBe('Unauthorized')
    })

    it('returns 401 when API_KEY is set and Authorization header is wrong', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/urls',
        payload: { originalUrl: 'https://example.com' },
        headers: { authorization: 'Bearer wrong-key' },
      })

      expect(res.statusCode).toBe(401)
    })

    it('returns 201 when API_KEY is set and correct Authorization header is provided', async () => {
      vi.mocked(createUrl).mockResolvedValue(mockUrlResult)

      const res = await app.inject({
        method: 'POST',
        url: '/urls',
        payload: { originalUrl: 'https://example.com' },
        headers: { authorization: 'Bearer test-api-key' },
      })

      expect(res.statusCode).toBe(201)
    })
  })

  describe('GET /urls', () => {
    it('returns 401 when no Authorization header is provided', async () => {
      const res = await app.inject({ method: 'GET', url: '/urls' })

      expect(res.statusCode).toBe(401)
      expect(res.json().error).toBe('Unauthorized')
    })

    it('returns 200 when correct Authorization header is provided', async () => {
      vi.mocked(getUrlList).mockResolvedValue({
        data: [],
        meta: { page: 1, perPage: 20, total: 0, totalPages: 0 },
      })

      const res = await app.inject({
        method: 'GET',
        url: '/urls',
        headers: { authorization: 'Bearer test-api-key' },
      })

      expect(res.statusCode).toBe(200)
    })
  })

  describe('GET /urls/:slug/stats', () => {
    it('returns 401 when no Authorization header is provided', async () => {
      const res = await app.inject({ method: 'GET', url: '/urls/abc12345/stats' })

      expect(res.statusCode).toBe(401)
    })
  })

  describe('GET /preview/:slug', () => {
    it('returns 401 when no Authorization header is provided', async () => {
      const res = await app.inject({ method: 'GET', url: '/preview/abc12345' })

      expect(res.statusCode).toBe(401)
    })
  })

  describe('DELETE /urls/:slug', () => {
    it('returns 401 when API_KEY is set and no Authorization header is provided', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/urls/abc12345' })

      expect(res.statusCode).toBe(401)
      expect(res.json().error).toBe('Unauthorized')
    })

    it('returns 204 when API_KEY is set and correct Authorization header is provided', async () => {
      vi.mocked(deleteUrl).mockResolvedValue(true)

      const res = await app.inject({
        method: 'DELETE',
        url: '/urls/abc12345',
        headers: { authorization: 'Bearer test-api-key' },
      })

      expect(res.statusCode).toBe(204)
    })
  })

  describe('DELETE /urls', () => {
    it('returns 401 when API_KEY is set and no Authorization header is provided', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/urls',
        payload: { slugs: ['abc12345'] },
      })

      expect(res.statusCode).toBe(401)
      expect(res.json().error).toBe('Unauthorized')
    })

    it('returns 200 when API_KEY is set and correct Authorization header is provided', async () => {
      vi.mocked(deleteUrls).mockResolvedValue({ deleted: 1 })

      const res = await app.inject({
        method: 'DELETE',
        url: '/urls',
        payload: { slugs: ['abc12345'] },
        headers: { authorization: 'Bearer test-api-key' },
      })

      expect(res.statusCode).toBe(200)
    })
  })
})

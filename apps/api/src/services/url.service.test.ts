import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  makeSelectChain,
  mockFindFirstUrl,
  mockFindManyClicks,
  mockInsertReturning,
  mockSelectChain,
  mockDeleteReturning,
} = vi.hoisted(() => {
  function makeSelectChain(result: unknown) {
    const chain: Record<string, unknown> = {
      then(onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) {
        return Promise.resolve(result).then(onFulfilled, onRejected)
      },
    }
    const chainMethods = ['from', 'where', 'groupBy', 'orderBy', 'limit', 'offset']
    for (const method of chainMethods) {
      chain[method] = () => chain
    }
    return chain
  }

  return {
    makeSelectChain,
    mockFindFirstUrl: vi.fn(),
    mockFindManyClicks: vi.fn(),
    mockInsertReturning: vi.fn(),
    mockSelectChain: vi.fn(() => makeSelectChain([])),
    mockDeleteReturning: vi.fn(),
  }
})

vi.mock('../db/client.js', () => ({
  db: {
    query: {
      urls: { findFirst: mockFindFirstUrl },
      clicks: { findMany: mockFindManyClicks },
    },
    insert: () => ({ values: () => ({ returning: mockInsertReturning }) }),
    select: mockSelectChain,
    delete: () => ({ where: () => ({ returning: mockDeleteReturning }) }),
  },
}))

vi.mock('nanoid', () => ({ nanoid: vi.fn(() => 'abc12345') }))

vi.mock('node:dns/promises', () => ({
  default: { resolve4: vi.fn() },
}))

vi.mock('ipaddr.js', () => ({
  default: { parse: vi.fn(() => ({ range: () => 'unicast' })) },
}))

import {
  createUrl,
  findUrlBySlug,
  recordClick,
  getUrlStats,
  deleteUrl,
  getUrlList,
  getUrlPreview,
} from './url.service.js'
import dns from 'node:dns/promises'
import ipaddr from 'ipaddr.js'

const BASE_URL = 'http://localhost:3001'

const mockUrlRow = {
  id: 'uuid-1',
  slug: 'abc12345',
  originalUrl: 'https://example.com',
  customSlug: false,
  expiresAt: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(dns.resolve4).mockResolvedValue(['1.2.3.4'])
  vi.mocked(ipaddr.parse).mockReturnValue({ range: () => 'unicast' } as ReturnType<
    typeof ipaddr.parse
  >)
  mockSelectChain.mockReturnValue(makeSelectChain([]))
})

describe('createUrl', () => {
  it('throws REDIRECT_LOOP when URL points to the base URL host', async () => {
    await expect(
      createUrl({ originalUrl: 'http://localhost:3001/path' }, BASE_URL),
    ).rejects.toThrow('REDIRECT_LOOP')
  })

  it('throws UNRESOLVED_DNS when DNS lookup fails', async () => {
    vi.mocked(dns.resolve4).mockRejectedValue(new Error('ENOTFOUND'))
    await expect(
      createUrl({ originalUrl: 'https://nonexistent.example.test' }, BASE_URL),
    ).rejects.toThrow('UNRESOLVED_DNS')
  })

  it('throws PRIVATE_ADDRESS when URL resolves to a private IP', async () => {
    vi.mocked(dns.resolve4).mockResolvedValue(['192.168.1.1'])
    vi.mocked(ipaddr.parse).mockReturnValue({ range: () => 'private' } as ReturnType<
      typeof ipaddr.parse
    >)
    await expect(
      createUrl({ originalUrl: 'https://internal.example.com' }, BASE_URL),
    ).rejects.toThrow('PRIVATE_ADDRESS')
  })

  it('throws SLUG_TAKEN when custom slug is already in use', async () => {
    mockFindFirstUrl.mockResolvedValue(mockUrlRow)
    await expect(
      createUrl({ originalUrl: 'https://example.com', customSlug: 'taken' }, BASE_URL),
    ).rejects.toThrow('SLUG_TAKEN')
  })

  it('creates a URL with a custom slug and returns the short URL', async () => {
    mockFindFirstUrl.mockResolvedValue(null)
    mockInsertReturning.mockResolvedValue([mockUrlRow])

    const result = await createUrl(
      { originalUrl: 'https://example.com', customSlug: 'myslug' },
      BASE_URL,
    )

    expect(result.shortUrl).toBe('http://localhost:3001/abc12345')
    expect(result.originalUrl).toBe('https://example.com')
  })

  it('creates a URL with an auto-generated slug', async () => {
    mockInsertReturning.mockResolvedValue([mockUrlRow])

    const result = await createUrl({ originalUrl: 'https://example.com' }, BASE_URL)

    expect(result.shortUrl).toBe('http://localhost:3001/abc12345')
  })

  it('retries on unique constraint collision and succeeds', async () => {
    const uniqueError = Object.assign(new Error('unique violation'), { code: '23505' })
    mockInsertReturning.mockRejectedValueOnce(uniqueError).mockResolvedValueOnce([mockUrlRow])

    const result = await createUrl({ originalUrl: 'https://example.com' }, BASE_URL)

    expect(mockInsertReturning).toHaveBeenCalledTimes(2)
    expect(result.slug).toBe('abc12345')
  })

  it('throws after exhausting all retry attempts', async () => {
    const uniqueError = Object.assign(new Error('unique violation'), { code: '23505' })
    mockInsertReturning.mockRejectedValue(uniqueError)

    await expect(createUrl({ originalUrl: 'https://example.com' }, BASE_URL)).rejects.toThrow(
      'Failed to generate unique slug after retries',
    )

    expect(mockInsertReturning).toHaveBeenCalledTimes(3)
  })
})

describe('findUrlBySlug', () => {
  it('returns the URL when found', async () => {
    mockFindFirstUrl.mockResolvedValue(mockUrlRow)
    const result = await findUrlBySlug('abc12345')
    expect(result).toEqual(mockUrlRow)
  })

  it('returns null when not found', async () => {
    mockFindFirstUrl.mockResolvedValue(undefined)
    const result = await findUrlBySlug('notexist')
    expect(result).toBeNull()
  })
})

describe('recordClick', () => {
  it('inserts a click record without throwing', async () => {
    await expect(
      recordClick('uuid-1', {
        ipHash: 'hash',
        userAgent: 'Mozilla/5.0',
        referer: 'https://ref.com',
      }),
    ).resolves.toBeUndefined()
  })
})

describe('getUrlStats', () => {
  it('returns null when the slug does not exist', async () => {
    mockFindFirstUrl.mockResolvedValue(undefined)
    const result = await getUrlStats('notexist')
    expect(result).toBeNull()
  })

  it('returns aggregated stats for a valid slug', async () => {
    mockFindFirstUrl.mockResolvedValue(mockUrlRow)
    mockSelectChain
      .mockReturnValueOnce(makeSelectChain([{ total: 5, last24h: 2, last7d: 4 }]))
      .mockReturnValueOnce(makeSelectChain([]))
    mockFindManyClicks.mockResolvedValue([])

    const result = await getUrlStats('abc12345')

    expect(result).not.toBeNull()
    expect(result!.totalClicks).toBe(5)
    expect(result!.clicksLast24h).toBe(2)
    expect(result!.clicksLast7d).toBe(4)
    expect(result!.url.slug).toBe('abc12345')
    expect(result!.clicksByDay).toHaveLength(30)
  })
})

describe('deleteUrl', () => {
  it('returns true when the URL is deleted', async () => {
    mockDeleteReturning.mockResolvedValue([mockUrlRow])
    const result = await deleteUrl('abc12345')
    expect(result).toBe(true)
  })

  it('returns false when the URL does not exist', async () => {
    mockDeleteReturning.mockResolvedValue([])
    const result = await deleteUrl('notexist')
    expect(result).toBe(false)
  })
})

describe('getUrlList', () => {
  it('returns paginated results', async () => {
    mockSelectChain
      .mockReturnValueOnce(makeSelectChain([mockUrlRow])) // rows query
      .mockReturnValueOnce(makeSelectChain([{ count: 1 }])) // count query
    const result = await getUrlList(1, 10, 0)
    expect(result).toEqual({
      data: [
        {
          id: mockUrlRow.id,
          slug: mockUrlRow.slug,
          originalUrl: mockUrlRow.originalUrl,
          customSlug: mockUrlRow.customSlug,
          expiresAt: null,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      meta: {
        total: 1,
        page: 1,
        perPage: 10,
        totalPages: 1,
      },
    })
  })

  it('returns empty data when no URLs exist', async () => {
    mockSelectChain
      .mockReturnValueOnce(makeSelectChain([])) // rows query
      .mockReturnValueOnce(makeSelectChain([{ count: 0 }])) // count query
    const result = await getUrlList(1, 20, 0)
    expect(result.data).toHaveLength(0)
    expect(result.meta).toEqual({
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    })
  })
})

describe('getUrlPreview', () => {
  it('returns preview for existing url record', async () => {
    mockFindFirstUrl.mockResolvedValue(mockUrlRow)
    const result = await getUrlPreview('abc12345')
    expect(result).toEqual({
      id: mockUrlRow.id,
      slug: mockUrlRow.slug,
      originalUrl: mockUrlRow.originalUrl,
      customSlug: mockUrlRow.customSlug,
      expiresAt: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    })
  })

  it('returns null if url does not exist', async () => {
    mockFindFirstUrl.mockResolvedValue(null)
    const result = await getUrlPreview('abc12345')
    expect(result).toBeNull()
  })

  it('throws EXPIRED if url is expired', async () => {
    mockFindFirstUrl.mockResolvedValue({
      ...mockUrlRow,
      expiresAt: new Date('2020-01-01'),
    })
    await expect(getUrlPreview('abc12345')).rejects.toThrow('EXPIRED')
  })
})

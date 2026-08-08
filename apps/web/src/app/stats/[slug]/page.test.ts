import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { UrlStats } from '@snip/types'

const { mockGetStats, MockApiError } = vi.hoisted(() => {
  class MockApiError extends Error {
    constructor(
      public readonly status: number,
      message: string,
    ) {
      super(message)
      this.name = 'ApiError'
    }
  }
  return { mockGetStats: vi.fn(), MockApiError }
})

vi.mock('@/lib/api', () => ({
  api: { getStats: mockGetStats },
  ApiError: MockApiError,
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

import StatsPage, { generateMetadata } from './page'
import { notFound } from 'next/navigation'

const mockStats: UrlStats = {
  url: {
    id: 'uuid-1',
    slug: 'abc123',
    originalUrl: 'https://example.com',
    customSlug: false,
    title: 'Example',
    description: 'An example page',
    expiresAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    shortUrl: 'http://localhost:3001/abc123',
  },
  totalClicks: 5,
  clicksByDay: [{ date: '2024-01-01', count: 5 }],
  clicksLast24h: 1,
  clicksLast7d: 5,
  recentClicks: [],
  referrers: [],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('StatsPage', () => {
  it('renders StatsView with the fetched stats on the happy path', async () => {
    mockGetStats.mockResolvedValue(mockStats)

    const result = await StatsPage({ params: Promise.resolve({ slug: 'abc123' }) })

    expect(mockGetStats).toHaveBeenCalledWith('abc123')
    expect(result.props).toEqual({ stats: mockStats, slug: 'abc123' })
  })

  it('calls notFound() when the API returns a 404', async () => {
    mockGetStats.mockRejectedValue(new MockApiError(404, 'Not found'))

    await expect(StatsPage({ params: Promise.resolve({ slug: 'missing' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    )
    expect(notFound).toHaveBeenCalled()
  })

  it('rethrows non-404 errors for the error boundary to catch', async () => {
    mockGetStats.mockRejectedValue(new MockApiError(500, 'Server error'))

    await expect(StatsPage({ params: Promise.resolve({ slug: 'abc123' }) })).rejects.toThrow(
      'Server error',
    )
    expect(notFound).not.toHaveBeenCalled()
  })

  it('rethrows errors that are not ApiError instances', async () => {
    mockGetStats.mockRejectedValue(new Error('network down'))

    await expect(StatsPage({ params: Promise.resolve({ slug: 'abc123' }) })).rejects.toThrow(
      'network down',
    )
  })
})

describe('generateMetadata', () => {
  it('includes the URL and click count on the happy path', async () => {
    mockGetStats.mockResolvedValue(mockStats)

    const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'abc123' }) })

    expect(metadata.title).toBe('Stats for /abc123 — snip')
    expect(metadata.description).toBe('https://example.com · 5 clicks')
  })

  it('falls back to a not-found title when the slug does not exist', async () => {
    mockGetStats.mockRejectedValue(new MockApiError(404, 'Not found'))

    const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'missing' }) })

    expect(metadata.title).toBe('Not found — snip')
    expect(metadata.description).toBeUndefined()
  })
})

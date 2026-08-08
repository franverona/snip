// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'
import { describe, expect, it, vi } from 'vitest'
import type { UrlList } from '@snip/types'
import { theme } from '@/lib/theme'
import { ToastProvider } from '@/components/Toast'
import { UrlsView } from './UrlsView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@/lib/api', () => ({
  api: { deleteUrl: vi.fn(), deleteUrls: vi.fn() },
}))

function makeList(overrides: Partial<UrlList> = {}): UrlList {
  return {
    data: [],
    meta: { total: 0, page: 1, perPage: 10, totalPages: 0 },
    ...overrides,
  }
}

function renderUrlsView(props: React.ComponentProps<typeof UrlsView>) {
  return render(
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <UrlsView {...props} />
      </ToastProvider>
    </ThemeProvider>,
  )
}

describe('UrlsView', () => {
  it('renders the table and pagination when there is data', () => {
    const data = makeList({
      data: [
        {
          id: '1',
          slug: 'abc123',
          originalUrl: 'https://example.com',
          shortUrl: 'http://localhost:3001/abc123',
          customSlug: false,
          title: null,
          description: null,
          expiresAt: null,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      meta: { total: 1, page: 1, perPage: 10, totalPages: 1 },
    })
    renderUrlsView({ data })

    expect(screen.getByText('https://example.com')).toBeInTheDocument()
    expect(screen.getByText('1–1 of 1 URLs')).toBeInTheDocument()
  })

  it('shows a generic empty message when there is no query', () => {
    renderUrlsView({ data: makeList() })
    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('shows a query-specific empty message when searching with no matches', () => {
    renderUrlsView({ data: makeList(), q: 'nothing-matches' })
    expect(screen.getByText('No results for "nothing-matches"')).toBeInTheDocument()
  })

  it('treats an out-of-range page as an empty result', () => {
    const data = makeList({ meta: { total: 5, page: 3, perPage: 10, totalPages: 1 } })
    renderUrlsView({ data })
    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('renders the search input with the current query', () => {
    renderUrlsView({ data: makeList(), q: 'foo' })
    expect(screen.getByLabelText('Search URLs')).toHaveValue('foo')
  })
})

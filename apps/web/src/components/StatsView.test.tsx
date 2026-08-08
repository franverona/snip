// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'styled-components'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { UrlStats } from '@snip/types'
import { theme } from '@/lib/theme'
import { ToastProvider } from '@/components/Toast'
import { StatsView } from './StatsView'

const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh, replace: vi.fn() }),
}))

vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    constructor(
      public readonly status: number,
      message: string,
    ) {
      super(message)
      this.name = 'ApiError'
    }
  }
  return {
    api: { deleteUrl: vi.fn(), updateUrl: vi.fn() },
    ApiError,
  }
})

import { api } from '@/lib/api'

const mockUpdateUrl = vi.mocked(api.updateUrl)

const mockStats: UrlStats = {
  url: {
    id: 'uuid-1',
    slug: 'abc123',
    originalUrl: 'https://example.com',
    customSlug: false,
    title: 'Original title',
    description: 'Original description',
    expiresAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    shortUrl: 'http://localhost:3001/abc123',
  },
  totalClicks: 0,
  clicksByDay: [],
  clicksLast24h: 0,
  clicksLast7d: 0,
  recentClicks: [],
  referrers: [],
}

function renderStatsView() {
  return render(
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <StatsView stats={mockStats} slug="abc123" />
      </ToastProvider>
    </ThemeProvider>,
  )
}

beforeEach(() => {
  mockRefresh.mockClear()
  mockUpdateUrl.mockReset()
})

describe('StatsView — edit', () => {
  it('does not show the edit form until Edit is clicked', () => {
    renderStatsView()
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument()
  })

  it('opens the edit form pre-filled with the current title and description', async () => {
    const user = userEvent.setup()
    renderStatsView()

    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(screen.getByLabelText('Title')).toHaveValue('Original title')
    expect(screen.getByLabelText('Description')).toHaveValue('Original description')
  })

  it('saves the edited fields and refreshes on success', async () => {
    const user = userEvent.setup()
    mockUpdateUrl.mockResolvedValue({ ...mockStats.url, title: 'New title' })
    renderStatsView()

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), 'New title')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(mockUpdateUrl).toHaveBeenCalledWith('abc123', {
        title: 'New title',
        description: 'Original description',
        expiresAt: null,
      }),
    )
    expect(await screen.findByText('URL updated')).toBeInTheDocument()
    expect(mockRefresh).toHaveBeenCalledTimes(1)
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument()
  })

  it('clears a field by submitting it empty', async () => {
    const user = userEvent.setup()
    mockUpdateUrl.mockResolvedValue({ ...mockStats.url, description: null })
    renderStatsView()

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByLabelText('Description'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(mockUpdateUrl).toHaveBeenCalledWith(
        'abc123',
        expect.objectContaining({ description: null }),
      ),
    )
  })

  it('shows an error toast and keeps the form open when saving fails', async () => {
    const user = userEvent.setup()
    mockUpdateUrl.mockRejectedValue(new Error('network error'))
    renderStatsView()

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Failed to update the URL.')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('discards changes when Cancel is clicked', async () => {
    const user = userEvent.setup()
    renderStatsView()

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), 'Unsaved change')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument()
    expect(mockUpdateUrl).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByLabelText('Title')).toHaveValue('Original title')
  })
})

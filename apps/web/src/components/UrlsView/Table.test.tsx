// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'styled-components'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UrlListRecord } from '@snip/types'
import { theme } from '@/lib/theme'
import { ToastProvider } from '@/components/Toast'
import { Table } from './Table'

const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

vi.mock('@/lib/api', () => ({
  api: { deleteUrl: vi.fn(), deleteUrls: vi.fn() },
}))

import { api } from '@/lib/api'

const mockDeleteUrl = vi.mocked(api.deleteUrl)
const mockDeleteUrls = vi.mocked(api.deleteUrls)

function makeUrl(overrides: Partial<UrlListRecord> = {}): UrlListRecord {
  return {
    id: overrides.id ?? 'uuid-1',
    slug: overrides.slug ?? 'abc123',
    originalUrl: overrides.originalUrl ?? 'https://example.com',
    shortUrl: overrides.shortUrl ?? 'http://localhost:3001/abc123',
    customSlug: overrides.customSlug ?? false,
    title: overrides.title ?? null,
    description: overrides.description ?? null,
    expiresAt: overrides.expiresAt ?? null,
    createdAt: overrides.createdAt ?? '2024-01-01T00:00:00.000Z',
  }
}

function renderTable(data: UrlListRecord[]) {
  return render(
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <Table data={data} />
      </ToastProvider>
    </ThemeProvider>,
  )
}

beforeEach(() => {
  mockRefresh.mockClear()
  mockDeleteUrl.mockReset()
  mockDeleteUrls.mockReset()
})

describe('Table', () => {
  it('renders a card per URL with its short and destination links', () => {
    renderTable([makeUrl({ slug: 'foo', shortUrl: 'http://localhost:3001/foo' })])
    expect(
      screen.getByRole('link', { name: /open http:\/\/localhost:3001\/foo/i }),
    ).toHaveAttribute('href', 'http://localhost:3001/foo')
    expect(screen.getByText('https://example.com')).toBeInTheDocument()
  })

  it('shows an expired badge for a URL past its expiry', () => {
    const expiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    renderTable([makeUrl({ expiresAt })])
    expect(screen.getByText('expired')).toBeInTheDocument()
  })

  it('shows an expiring-soon badge for a URL expiring within 7 days', () => {
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    renderTable([makeUrl({ expiresAt })])
    expect(screen.getByText(/expires in 3 days/)).toBeInTheDocument()
  })

  it('does not show an expiry badge for a URL with no expiry or a far-off one', () => {
    renderTable([makeUrl({ expiresAt: null })])
    expect(screen.queryByText('expired')).not.toBeInTheDocument()
    expect(screen.queryByText(/expires in/)).not.toBeInTheDocument()
  })

  it('deletes a single URL after confirming, shows a toast, and refreshes', async () => {
    const user = userEvent.setup()
    mockDeleteUrl.mockResolvedValue(undefined)
    renderTable([makeUrl({ slug: 'abc123' })])

    await user.click(screen.getByRole('button', { name: 'Delete /abc123' }))
    expect(screen.getByText('Delete /abc123?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(mockDeleteUrl).toHaveBeenCalledWith('abc123'))
    expect(await screen.findByText('URL removed')).toBeInTheDocument()
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('shows an error toast when a single delete fails', async () => {
    const user = userEvent.setup()
    mockDeleteUrl.mockRejectedValue(new Error('boom'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderTable([makeUrl({ slug: 'abc123' })])

    await user.click(screen.getByRole('button', { name: 'Delete /abc123' }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('An error occurred when deleting the URL.')).toBeInTheDocument()
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('supports selecting URLs and bulk-deleting them', async () => {
    const user = userEvent.setup()
    mockDeleteUrls.mockResolvedValue({ deleted: 2 })
    renderTable([makeUrl({ id: '1', slug: 'foo' }), makeUrl({ id: '2', slug: 'bar' })])

    await user.click(screen.getByRole('checkbox', { name: 'Select /foo' }))
    await user.click(screen.getByRole('checkbox', { name: 'Select /bar' }))

    expect(screen.getByText('2 selected')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /delete 2/i }))
    const dialog = screen.getByRole('alertdialog')
    expect(within(dialog).getByText('Delete 2 URLs?')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Delete 2' }))

    await waitFor(() =>
      expect(mockDeleteUrls).toHaveBeenCalledWith(expect.arrayContaining(['foo', 'bar'])),
    )
    expect(await screen.findByText('2 URLs deleted')).toBeInTheDocument()
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('clears the selection via the Clear button', async () => {
    const user = userEvent.setup()
    renderTable([makeUrl({ id: '1', slug: 'foo' })])

    await user.click(screen.getByRole('checkbox', { name: 'Select /foo' }))
    expect(screen.getByText('1 selected')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.queryByText('1 selected')).not.toBeInTheDocument()
  })
})

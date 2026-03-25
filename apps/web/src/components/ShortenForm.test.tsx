// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'styled-components'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '@/lib/theme'
import { ToastProvider } from '@/components/Toast'
import { ShortenForm } from '@/components/ShortenForm'

vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.name = 'ApiError'
      this.status = status
    }
  }
  return {
    api: { createUrl: vi.fn() },
    ApiError,
  }
})

// qrcode.react renders an SVG — fine in jsdom, no mock needed.
// navigator.clipboard and navigator.share are not present in jsdom by default.
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  configurable: true,
})
Object.defineProperty(navigator, 'share', {
  value: undefined,
  configurable: true,
})

import { api, ApiError } from '@/lib/api'

const mockCreateUrl = vi.mocked(api.createUrl)

function renderForm() {
  return render(
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <ShortenForm />
      </ToastProvider>
    </ThemeProvider>,
  )
}

const stubResult = {
  id: '1',
  slug: 'abc123',
  shortUrl: 'http://localhost:3001/abc123',
  originalUrl: 'https://example.com',
  customSlug: false,
  title: null,
  description: null,
  expiresAt: null,
  createdAt: new Date().toISOString(),
  existing: false,
}

describe('ShortenForm', () => {
  beforeEach(() => {
    mockCreateUrl.mockReset()
  })

  it('renders the URL input and submit button', () => {
    renderForm()
    expect(screen.getByLabelText(/url to shorten/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /shorten url/i })).toBeInTheDocument()
  })

  it('does not call the API when the URL field is empty', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: /shorten url/i }))

    await waitFor(() => {
      expect(mockCreateUrl).not.toHaveBeenCalled()
    })
  })

  it('shows a field validation error for an invalid URL', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/url to shorten/i), 'not-a-url')
    await user.click(screen.getByRole('button', { name: /shorten url/i }))

    await waitFor(() => {
      expect(mockCreateUrl).not.toHaveBeenCalled()
    })
    // At least one inline error message should appear
    expect(screen.getAllByRole('paragraph').length).toBeGreaterThan(0)
  })

  it('shows the result box with the short URL on success', async () => {
    const user = userEvent.setup()
    mockCreateUrl.mockResolvedValue(stubResult)

    renderForm()
    await user.type(screen.getByLabelText(/url to shorten/i), 'https://example.com')
    await user.click(screen.getByRole('button', { name: /shorten url/i }))

    await waitFor(() => {
      expect(screen.getByText('Your short URL is ready!')).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: 'http://localhost:3001/abc123' })).toBeInTheDocument()
  })

  it('shows the "existing link" message when the URL was already shortened', async () => {
    const user = userEvent.setup()
    mockCreateUrl.mockResolvedValue({ ...stubResult, existing: true })

    renderForm()
    await user.type(screen.getByLabelText(/url to shorten/i), 'https://example.com')
    await user.click(screen.getByRole('button', { name: /shorten url/i }))

    await waitFor(() => {
      expect(screen.getByText(/already shortened/i)).toBeInTheDocument()
    })
  })

  it('shows an error box when the API call fails', async () => {
    const user = userEvent.setup()
    mockCreateUrl.mockRejectedValue(new ApiError(500, 'Internal server error'))

    renderForm()
    await user.type(screen.getByLabelText(/url to shorten/i), 'https://example.com')
    await user.click(screen.getByRole('button', { name: /shorten url/i }))

    await waitFor(() => {
      expect(screen.getAllByText('Internal server error').length).toBeGreaterThan(0)
    })
  })

  it('toggles the advanced options section', async () => {
    const user = userEvent.setup()
    renderForm()

    expect(screen.queryByLabelText(/^title/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /advanced options/i }))
    expect(screen.getByLabelText(/^title/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /hide advanced options/i }))
    expect(screen.queryByLabelText(/^title/i)).not.toBeInTheDocument()
  })

  it('sends custom slug and advanced fields when filled in', async () => {
    const user = userEvent.setup()
    mockCreateUrl.mockResolvedValue({
      ...stubResult,
      slug: 'my-slug',
      shortUrl: 'http://localhost:3001/my-slug',
    })

    renderForm()
    await user.type(screen.getByLabelText(/url to shorten/i), 'https://example.com')
    await user.type(screen.getByLabelText(/custom slug/i), 'my-slug')

    await user.click(screen.getByRole('button', { name: /advanced options/i }))
    await user.type(screen.getByLabelText(/^title/i), 'My Title')

    await user.click(screen.getByRole('button', { name: /shorten url/i }))

    await waitFor(() => {
      expect(mockCreateUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          originalUrl: 'https://example.com',
          customSlug: 'my-slug',
          title: 'My Title',
        }),
      )
    })
  })
})

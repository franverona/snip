// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'
import { describe, expect, it } from 'vitest'
import { theme } from '@/lib/theme'
import { Pagination } from './Pagination'

function renderPagination(props: React.ComponentProps<typeof Pagination>) {
  return render(
    <ThemeProvider theme={theme}>
      <Pagination {...props} />
    </ThemeProvider>,
  )
}

describe('Pagination', () => {
  it('shows the result range and current page', () => {
    renderPagination({ page: 2, perPage: 10, total: 25, totalPages: 3 })
    expect(screen.getByText('11–20 of 25 URLs')).toBeInTheDocument()
    expect(screen.getByText('Page 2')).toBeInTheDocument()
  })

  it('caps the upper limit at the total on the last page', () => {
    renderPagination({ page: 3, perPage: 10, total: 25, totalPages: 3 })
    expect(screen.getByText('21–25 of 25 URLs')).toBeInTheDocument()
  })

  it('disables Prev on the first page', () => {
    renderPagination({ page: 1, perPage: 10, total: 25, totalPages: 3 })
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Next page' })).toHaveAttribute(
      'href',
      '?page=2&perPage=10',
    )
  })

  it('disables Next on the last page', () => {
    renderPagination({ page: 3, perPage: 10, total: 25, totalPages: 3 })
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Previous page' })).toHaveAttribute(
      'href',
      '?page=2&perPage=10',
    )
  })

  it('builds Prev/Next hrefs that preserve the search query', () => {
    renderPagination({ page: 2, perPage: 10, total: 25, totalPages: 3, q: 'foo bar' })
    expect(screen.getByRole('link', { name: 'Previous page' })).toHaveAttribute(
      'href',
      '?page=1&perPage=10&q=foo+bar',
    )
    expect(screen.getByRole('link', { name: 'Next page' })).toHaveAttribute(
      'href',
      '?page=3&perPage=10&q=foo+bar',
    )
  })

  it('enables both Prev and Next on a middle page', () => {
    renderPagination({ page: 2, perPage: 10, total: 25, totalPages: 3 })
    expect(screen.getByRole('link', { name: 'Previous page' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Next page' })).toBeInTheDocument()
  })
})

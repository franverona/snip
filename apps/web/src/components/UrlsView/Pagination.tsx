'use client'

import Link from 'next/link'
import styled from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.8125rem;
  padding: 0.75rem 0.5rem 0;
  border-top: 1px solid #f3f4f6;
`

const TotalResults = styled.div`
  color: #6b7280;
  font-weight: 500;
`

const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
`

const pageButtonBase = `
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.3rem 0.75rem;
  border-radius: 5px;
  border: 1px solid #e5e7eb;
  font-size: 0.8125rem;
  font-weight: 500;
  text-decoration: none;
  line-height: 1;
`

const PageButton = styled(Link)`
  ${pageButtonBase}
  color: #374151;
  background: #fff;
  transition: all 0.15s ease;

  &:hover {
    color: #2563eb;
    border-color: #bfdbfe;
    background: #eff6ff;
  }
`

const PageButtonDisabled = styled.div`
  ${pageButtonBase}
  color: #d1d5db;
  background: #f9fafb;
  cursor: default;
`

const CurrentPage = styled.div`
  padding: 0.3rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #6b7280;
`

export function Pagination({
  page,
  perPage,
  total,
  totalPages,
}: {
  page: number
  perPage: number
  total: number
  totalPages: number
}) {
  const prevPage = page - 1
  const nextPage = page + 1
  const lowerLimit = (page - 1) * perPage + 1
  const upperLimit = page * perPage < total ? page * perPage : total
  return (
    <Wrapper>
      <TotalResults>
        {lowerLimit}–{upperLimit} of {total} URLs
      </TotalResults>
      <ActionsWrapper>
        {prevPage < 1 ? (
          <PageButtonDisabled role="button" aria-disabled>
            ← Prev
          </PageButtonDisabled>
        ) : (
          <PageButton
            href={`?page=${prevPage}&perPage=${perPage}`}
            onClick={() => window.scrollTo({ top: 0 })}
          >
            ← Prev
          </PageButton>
        )}
        <CurrentPage>Page {page}</CurrentPage>
        {nextPage > totalPages ? (
          <PageButtonDisabled role="button" aria-disabled>
            Next →
          </PageButtonDisabled>
        ) : (
          <PageButton
            href={`?page=${nextPage}&perPage=${perPage}`}
            onClick={() => window.scrollTo({ top: 0 })}
          >
            Next →
          </PageButton>
        )}
      </ActionsWrapper>
    </Wrapper>
  )
}

'use client'

import Link from 'next/link'
import styled from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.875rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
`

const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const PageLinkDisabled = styled.div`
  cursor: default;
  opacity: 0.4;
`

const TotalResults = styled.div`
  cursor: default;
  font-weight: 500;
`

const CurrentPage = styled.div`
  cursor: default;
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
  const lowerLimit = (page - 1) * perPage
  const upperLimit = page * perPage < total ? page * perPage : total
  return (
    <Wrapper>
      <TotalResults>
        {lowerLimit} - {upperLimit} of {total} URLs
      </TotalResults>
      <ActionsWrapper>
        {prevPage < 1 ? (
          <PageLinkDisabled role="button" aria-disabled>
            Previous
          </PageLinkDisabled>
        ) : (
          <Link
            href={`?page=${prevPage}&perPage=${perPage}`}
            onClick={() => window.scrollTo({ top: 0 })}
          >
            Previous
          </Link>
        )}
        <CurrentPage>Page {page}</CurrentPage>
        {nextPage > totalPages ? (
          <PageLinkDisabled role="button" aria-disabled>
            Next
          </PageLinkDisabled>
        ) : (
          <Link
            href={`?page=${nextPage}&perPage=${perPage}`}
            onClick={() => window.scrollTo({ top: 0 })}
          >
            Next
          </Link>
        )}
      </ActionsWrapper>
    </Wrapper>
  )
}

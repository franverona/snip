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

const PageLink = styled(Link)``

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
  return (
    <Wrapper>
      <TotalResults>
        {total} {total === 1 ? 'URL' : 'URLs'}
      </TotalResults>
      <ActionsWrapper>
        {prevPage < 1 ? (
          <PageLinkDisabled role="button" aria-disabled>
            Previous
          </PageLinkDisabled>
        ) : (
          <PageLink aria-disabled={prevPage < 1} href={`?page=${prevPage}&perPage=${perPage}`}>
            Previous
          </PageLink>
        )}
        <CurrentPage>Page {page}</CurrentPage>
        {nextPage > totalPages ? (
          <PageLinkDisabled role="button" aria-disabled>
            Next
          </PageLinkDisabled>
        ) : (
          <PageLink href={`?page=${nextPage}&perPage=${perPage}`}>Next</PageLink>
        )}
      </ActionsWrapper>
    </Wrapper>
  )
}

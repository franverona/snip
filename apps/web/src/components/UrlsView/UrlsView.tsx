import { type UrlList } from '@snip/types'
import { Pagination } from './Pagination'
import { Table } from './Table'
import styled from 'styled-components'
import { PerPageSelector } from './PerPageSelector'
import { SearchForm } from './SearchForm'

const EmptyPlaceholder = styled.div`
  text-align: center;
  color: #6b7688;
  font-size: 0.875rem;
`

const ControlsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 480px) {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
`

const PerPageWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  flex-shrink: 0;
`

const PerPageLabel = styled.span`
  @media (max-width: 480px) {
    display: none;
  }
`

export function UrlsView({ data, q }: { data: UrlList; q?: string }) {
  const noResults = data.meta.totalPages === 0 || data.meta.page > data.meta.totalPages

  return (
    <div>
      <ControlsBar>
        <SearchForm key={q ?? ''} q={q} perPage={data.meta.perPage} />
        <PerPageWrapper>
          <PerPageSelector perPage={data.meta.perPage} q={q} />
          <PerPageLabel>Items per page</PerPageLabel>
        </PerPageWrapper>
      </ControlsBar>
      {noResults ? (
        <EmptyPlaceholder>{q ? `No results for "${q}"` : 'No results'}</EmptyPlaceholder>
      ) : (
        <>
          <Table data={data.data} />
          <Pagination {...data.meta} q={q} />
        </>
      )}
    </div>
  )
}

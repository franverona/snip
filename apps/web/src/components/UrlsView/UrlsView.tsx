import { type UrlList } from '@snip/types'
import { Pagination } from './Pagination'
import { Table } from './Table'
import styled from 'styled-components'
import { PerPageSelector } from './PerPageSelector'

const EmptyPlaceholder = styled.div`
  text-align: center;
  color: #6b7688;
  font-size: 0.875rem;
`

const PerPageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
`

export function UrlsView({ data }: { data: UrlList }) {
  if (data.meta.totalPages === 0 || data.meta.page > data.meta.totalPages) {
    return <EmptyPlaceholder>No results</EmptyPlaceholder>
  }

  return (
    <div>
      <PerPageWrapper>
        <PerPageSelector perPage={data.meta.perPage} />
        Items per page
      </PerPageWrapper>
      <Table data={data.data} />
      <Pagination {...data.meta} />
    </div>
  )
}

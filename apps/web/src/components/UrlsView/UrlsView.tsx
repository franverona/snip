'use client'

import { type UrlList } from '@snip/types'
import { Pagination } from './Pagination'
import { Table } from './Table'

export function UrlsView({ data }: { data: UrlList }) {
  return (
    <div>
      <Table data={data.data} />
      <Pagination {...data.meta} />
    </div>
  )
}

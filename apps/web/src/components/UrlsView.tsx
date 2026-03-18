'use client'

import { type UrlList } from '@snip/types'
import Link from 'next/link'

export default function UrlsView({ data }: { data: UrlList }) {
  console.log(data)
  return (
    <div>
      <Link href={`?page=${data.meta.page - 1}`}>Prev</Link>
      <div>{data.meta.page}</div>
      <Link href={`?page=${data.meta.page + 1}`}>Next</Link>
    </div>
  )
}

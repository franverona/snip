import { UrlsView } from '@/components/UrlsView'
import { api } from '@/lib/api'
import { type Metadata } from 'next'
import { redirect } from 'next/navigation'

export function generateMetadata(): Metadata {
  return {
    title: 'URLs — snip',
    description: 'List of created URLs',
  }
}

interface Props {
  searchParams: Promise<{ page?: string; perPage?: string; q?: string }>
}

async function getData(page: string, perPage: string, q?: string) {
  const pageNumber = parseInt(page, 10)
  const perPageNumber = parseInt(perPage, 10)
  const parsedPerPage = Math.min(perPageNumber, 50)
  const parsedPage = Math.max(pageNumber, 1)
  const validPerPage = isNaN(parsedPerPage) || parsedPerPage < 1 ? 25 : parsedPerPage
  const validPage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage
  return await api.getUrls(validPage, validPerPage, q || undefined)
}

export default async function Page({ searchParams }: Props) {
  const { page = '1', perPage = '25', q } = await searchParams

  const data = await getData(page, perPage, q)

  const pageNumber = parseInt(page, 10)
  if (data.meta.totalPages > 0 && pageNumber > data.meta.totalPages) {
    redirect(`/urls?page=${data.meta.totalPages}`)
  }
  if (isNaN(pageNumber) || pageNumber < 1) {
    redirect('/urls?page=1')
  }

  return <UrlsView data={data} q={q} />
}

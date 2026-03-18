import UrlsView from '@/components/UrlsView'
import { api } from '@/lib/api'

interface Props {
  searchParams: Promise<{ page?: string; perPage?: string }>
}

async function getData(page: string, perPage: string) {
  const pageNumber = parseInt(page, 10)
  const perPageNumber = parseInt(perPage, 10)
  const parsedPerPage = Math.min(perPageNumber ?? 20, 100)
  const parsedPage = pageNumber ?? 1
  const validPerPage = isNaN(parsedPerPage) || parsedPerPage < 1 ? 20 : parsedPerPage
  const validPage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage
  return await api.getUrls(validPage, validPerPage)
}

export default async function Page({ searchParams }: Props) {
  const { page = '1', perPage = '20' } = await searchParams

  const data = await getData(page, perPage)

  return <UrlsView data={data} />
}

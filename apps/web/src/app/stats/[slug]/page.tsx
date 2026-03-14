import { api } from '@/lib/api'
import { notFound } from 'next/navigation'
import { StatsView } from '@/components/StatsView'
import type { UrlStats } from '@snip/types'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function StatsPage({ params }: Props) {
  const { slug } = await params

  let stats: UrlStats
  try {
    stats = await api.getStats(slug)
  } catch {
    notFound()
  }

  return <StatsView stats={stats} slug={slug} />
}

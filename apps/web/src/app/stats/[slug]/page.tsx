import { api } from '@/lib/api'
import { notFound } from 'next/navigation'
import { StatsView } from '@/components/StatsView'
import type { UrlStats } from '@snip/types'
import { type Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const stats = await api.getStats(slug).catch(() => null)
  return {
    title: stats ? `Stats for /${slug} — snip` : 'Not found — snip',
    description: stats ? `${stats.url.originalUrl} · ${stats.totalClicks} clicks` : undefined,
  }
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

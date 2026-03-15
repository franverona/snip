import ipaddr from 'ipaddr.js'
import { eq, count, and, gte } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '../db/client.js'
import { urls, clicks, type Url, type Click } from '../db/schema.js'
import type { CreateUrlInput, UrlStats, ClickRecord, UrlRecord } from '@snip/types'
import dns from 'node:dns/promises'

function toUrlRecord(url: Url): UrlRecord {
  return {
    id: url.id,
    slug: url.slug,
    originalUrl: url.originalUrl,
    customSlug: url.customSlug,
    expiresAt: url.expiresAt ? url.expiresAt.toISOString() : null,
    createdAt: url.createdAt.toISOString(),
  }
}

function toClickRecord(click: Click): ClickRecord {
  return {
    id: click.id,
    urlId: click.urlId,
    clickedAt: click.clickedAt.toISOString(),
    ipHash: click.ipHash,
    userAgent: click.userAgent,
    referer: click.referer,
  }
}

export async function createUrl(input: CreateUrlInput, baseUrl: string) {
  const hostname = new URL(input.originalUrl).hostname
  let addresses: string[]
  try {
    addresses = await dns.resolve4(hostname)
  } catch {
    throw new Error('UNRESOLVED_DNS')
  }

  const isPrivate = addresses.some((ip) => ipaddr.parse(ip).range() !== 'unicast')
  if (isPrivate) {
    throw new Error('PRIVATE_ADDRESS')
  }

  const slug = input.customSlug ?? nanoid(8)

  if (input.customSlug) {
    const existing = await db.query.urls.findFirst({
      where: eq(urls.slug, input.customSlug),
    })
    if (existing) {
      throw new Error('SLUG_TAKEN')
    }
  }

  const [url] = await db
    .insert(urls)
    .values({
      slug,
      originalUrl: input.originalUrl,
      customSlug: !!input.customSlug,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .returning()

  if (!url) throw new Error('Failed to create URL')

  return {
    ...toUrlRecord(url),
    shortUrl: `${baseUrl}/${url.slug}`,
  }
}

export async function findUrlBySlug(slug: string): Promise<Url | null> {
  const url = await db.query.urls.findFirst({
    where: eq(urls.slug, slug),
  })
  return url ?? null
}

export async function recordClick(
  urlId: string,
  meta: { ipHash?: string; userAgent?: string; referer?: string },
) {
  await db.insert(clicks).values({
    urlId,
    ipHash: meta.ipHash ?? null,
    userAgent: meta.userAgent ?? null,
    referer: meta.referer ?? null,
  })
}

export async function getUrlStats(slug: string): Promise<UrlStats | null> {
  const url = await findUrlBySlug(slug)
  if (!url) return null

  const now = new Date()
  const ago24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const ago7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [totalResult] = await db
    .select({ value: count() })
    .from(clicks)
    .where(eq(clicks.urlId, url.id))

  const [last24hResult] = await db
    .select({ value: count() })
    .from(clicks)
    .where(and(eq(clicks.urlId, url.id), gte(clicks.clickedAt, ago24h)))

  const [last7dResult] = await db
    .select({ value: count() })
    .from(clicks)
    .where(and(eq(clicks.urlId, url.id), gte(clicks.clickedAt, ago7d)))

  const recentClicks = await db.query.clicks.findMany({
    where: eq(clicks.urlId, url.id),
    orderBy: (clicks, { desc }) => [desc(clicks.clickedAt)],
    limit: 10,
  })

  return {
    url: toUrlRecord(url),
    totalClicks: Number(totalResult?.value ?? 0),
    clicksLast24h: Number(last24hResult?.value ?? 0),
    clicksLast7d: Number(last7dResult?.value ?? 0),
    recentClicks: recentClicks.map(toClickRecord),
  }
}

export async function deleteUrl(slug: string): Promise<boolean> {
  const result = await db.delete(urls).where(eq(urls.slug, slug)).returning()
  return result.length > 0
}

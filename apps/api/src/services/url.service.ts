import ipaddr from 'ipaddr.js'
import { eq, count, and, gte, sql, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '../db/client.js'
import { urls, clicks, type Url, type Click } from '../db/schema.js'
import type { CreateUrlInput, UrlStats, ClickRecord, UrlRecord } from '@snip/types'
import dns from 'node:dns/promises'
import net from 'node:net'
import { totalPages } from '../lib/pagination.js'

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

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as Record<string, unknown>)['code'] === '23505'
  )
}

export async function createUrl(input: CreateUrlInput, baseUrl: string) {
  const baseHost = new URL(baseUrl).host
  const { host, hostname } = new URL(input.originalUrl)
  if (host === baseHost) {
    throw new Error('REDIRECT_LOOP')
  }

  let addresses: string[] = []
  if (net.isIP(hostname) !== 0) {
    addresses.push(hostname)
  } else {
    try {
      addresses = await dns.resolve4(hostname)
    } catch {
      throw new Error('UNRESOLVED_DNS')
    }
  }

  const isPrivate = addresses.some((ip) => ipaddr.parse(ip).range() !== 'unicast')
  if (isPrivate) {
    throw new Error('PRIVATE_ADDRESS')
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = input.customSlug ?? nanoid(8)
    try {
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
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        if (input.customSlug) throw new Error('SLUG_TAKEN', { cause: err })
        continue
      }
      throw err
    }
  }

  throw new Error('Failed to generate unique slug after retries')
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

export async function getUrlStats(slug: string, baseUrl: string): Promise<UrlStats | null> {
  const url = await findUrlBySlug(slug)
  if (!url) return null

  const now = new Date()
  const ago24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const ago7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const ago30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [clickStats] = await db
    .select({
      total: count(),
      last24h: sql<number>`count(*) filter (where ${clicks.clickedAt} >= ${ago24h})`,
      last7d: sql<number>`count(*) filter (where ${clicks.clickedAt} >= ${ago7d})`,
    })
    .from(clicks)
    .where(eq(clicks.urlId, url.id))

  const recentClicks = await db.query.clicks.findMany({
    where: eq(clicks.urlId, url.id),
    orderBy: (clicks, { desc }) => [desc(clicks.clickedAt)],
    limit: 10,
  })

  const clicksByDay = await db
    .select({
      date: sql<string>`date_trunc('day', ${clicks.clickedAt})::date::text`,
      count: count(),
    })
    .from(clicks)
    .where(and(eq(clicks.urlId, url.id), gte(clicks.clickedAt, ago30d)))
    .groupBy(sql`date_trunc('day', ${clicks.clickedAt})`)
    .orderBy(sql`date_trunc('day', ${clicks.clickedAt})`)

  const dayMap = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    dayMap.set(d.toISOString().slice(0, 10), 0)
  }
  for (const r of clicksByDay) {
    if (dayMap.has(r.date)) {
      dayMap.set(r.date, Number(r.count))
    }
  }

  return {
    url: { ...toUrlRecord(url), shortUrl: `${baseUrl}/${url.slug}` },
    totalClicks: Number(clickStats?.total ?? 0),
    clicksByDay: Array.from(dayMap, ([date, clicks]) => ({ date, count: clicks })),
    clicksLast24h: Number(clickStats?.last24h ?? 0),
    clicksLast7d: Number(clickStats?.last7d ?? 0),
    recentClicks: recentClicks.map(toClickRecord),
  }
}

export async function deleteUrl(slug: string): Promise<boolean> {
  const result = await db.delete(urls).where(eq(urls.slug, slug)).returning()
  return result.length > 0
}

export async function getUrlList(page: number, perPage: number, offset: number) {
  const [rows, count] = await Promise.all([
    db
      .select({
        id: urls.id,
        slug: urls.slug,
        originalUrl: urls.originalUrl,
        customSlug: urls.customSlug,
        expiresAt: urls.expiresAt,
        createdAt: urls.createdAt,
      })
      .from(urls)
      .orderBy(desc(urls.createdAt))
      .limit(perPage)
      .offset(offset),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(urls),
  ])

  const total = count[0]!.count
  return {
    data: rows.map(toUrlRecord),
    meta: {
      total,
      page,
      perPage,
      totalPages: totalPages(total, perPage),
    },
  }
}

export async function getUrlPreview(slug: string): Promise<UrlRecord | null> {
  const url = await findUrlBySlug(slug)
  if (!url) {
    return null
  }

  if (url.expiresAt && url.expiresAt < new Date()) {
    throw new Error('EXPIRED')
  }

  return toUrlRecord(url)
}

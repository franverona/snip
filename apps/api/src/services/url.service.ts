import ipaddr from 'ipaddr.js'
import { eq, count, and, gte, sql, desc, or, ilike, inArray } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { parse } from 'node-html-parser'
import { db } from '../db/client.js'
import { urls, clicks, type Url, type Click } from '../db/schema.js'
import type {
  CreateUrlInput,
  CreateUrlResponse,
  UrlStats,
  ClickRecord,
  UrlRecord,
  UrlErrorCode,
} from '@snip/types'
import dns from 'node:dns/promises'
import net from 'node:net'
import { totalPages } from '../lib/pagination.js'

function toUrlRecord(url: Url): UrlRecord {
  return {
    id: url.id,
    slug: url.slug,
    originalUrl: url.originalUrl,
    customSlug: url.customSlug,
    title: url.title,
    description: url.description,
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

export class UrlFetchError extends Error {
  constructor(
    public readonly code: UrlErrorCode,
    options?: ErrorOptions,
  ) {
    super(code, options)
    this.name = 'UrlFetchError'
  }
}

type PageMeta = { title: string | null; description: string | null }

const MAX_REDIRECTS = 5

async function fetchPageMeta(url: string): Promise<PageMeta> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    try {
      const fetchOpts = {
        signal: controller.signal,
        headers: { 'User-Agent': 'snip-bot/1.0 (link preview fetcher)' },
        redirect: 'manual' as const,
      }
      let currentUrl = url
      let res = await fetch(currentUrl, fetchOpts)
      let redirectsFollowed = 0
      while (res.status >= 300 && res.status < 400) {
        if (redirectsFollowed >= MAX_REDIRECTS) return { title: null, description: null }
        const location = res.headers.get('location')
        if (!location) break
        currentUrl = new URL(location, currentUrl).href
        redirectsFollowed++
        res = await fetch(currentUrl, fetchOpts)
      }
      if (!res.ok) return { title: null, description: null }
      const contentType = res.headers.get('content-type') ?? ''
      if (!contentType.includes('text/html')) return { title: null, description: null }
      const html = await res.text()
      const root = parse(html)
      const title = root.querySelector('title')?.text?.trim() || null
      const description =
        (
          root.querySelector('meta[name="description"]')?.getAttribute('content') ??
          root.querySelector('meta[property="og:description"]')?.getAttribute('content')
        )?.trim() || null
      return { title, description }
    } finally {
      clearTimeout(timeout)
    }
  } catch {
    return { title: null, description: null }
  }
}

export async function createUrl(
  input: CreateUrlInput,
  baseUrl: string,
): Promise<CreateUrlResponse> {
  const baseHost = new URL(baseUrl).host
  const { host, hostname } = new URL(input.originalUrl)
  if (host === baseHost) {
    throw new UrlFetchError('REDIRECT_LOOP')
  }

  let addresses: string[] = []
  if (net.isIP(hostname) !== 0) {
    addresses.push(hostname)
  } else {
    try {
      addresses = await dns.resolve4(hostname)
    } catch {
      throw new UrlFetchError('UNRESOLVED_DNS')
    }
  }

  const isPrivate = addresses.some((ip) => ipaddr.parse(ip).range() !== 'unicast')
  if (isPrivate) {
    throw new UrlFetchError('PRIVATE_ADDRESS')
  }

  if (!input.allowDuplicate) {
    const existing = await db.query.urls.findFirst({
      where: eq(urls.originalUrl, input.originalUrl),
    })
    if (existing) {
      return {
        ...toUrlRecord(existing),
        shortUrl: `${baseUrl}/${existing.slug}`,
        existing: true,
      }
    }
  }

  let title: string | null = input.title ?? null
  let description: string | null = input.description ?? null
  if (title === null || description === null) {
    const meta = await fetchPageMeta(input.originalUrl)
    if (title === null) title = meta.title
    if (description === null) description = meta.description
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
          title,
          description,
        })
        .returning()

      if (!url) throw new Error('Failed to create URL')

      return {
        ...toUrlRecord(url),
        shortUrl: `${baseUrl}/${url.slug}`,
      }
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        if (input.customSlug) throw new UrlFetchError('SLUG_TAKEN', { cause: err })
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

  // Extract hostname via split_part to avoid backslash escape issues in tagged template literals.
  // split_part(referer, '://', 2) → 'host/path', split_part(..., '/', 1) → 'host'
  const refDomain = sql<string>`case when ${clicks.referer} is null or ${clicks.referer} = '' then 'Direct' when ${clicks.referer} ~ '^https?://' then lower(split_part(split_part(${clicks.referer}, '://', 2), '/', 1)) else 'Direct' end`

  const referrers = await db
    .select({ domain: refDomain, count: count() })
    .from(clicks)
    .where(eq(clicks.urlId, url.id))
    .groupBy(refDomain)
    .orderBy(sql`count(*) desc`)
    .limit(10)

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
    referrers: referrers.map((r) => ({ domain: r.domain, count: Number(r.count) })),
  }
}

export async function deleteUrl(slug: string): Promise<boolean> {
  const result = await db.delete(urls).where(eq(urls.slug, slug)).returning()
  return result.length > 0
}

export async function deleteUrls(slugs: string[]): Promise<{ deleted: number }> {
  if (slugs.length === 0) return { deleted: 0 }
  const result = await db.delete(urls).where(inArray(urls.slug, slugs)).returning()
  return { deleted: result.length }
}

export async function getUrlList(page: number, perPage: number, offset: number, q?: string) {
  const escaped = q ? q.replace(/[%_\\]/g, '\\$&') : undefined
  const filter = escaped
    ? or(ilike(urls.slug, `%${escaped}%`), ilike(urls.originalUrl, `%${escaped}%`))
    : undefined

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: urls.id,
        slug: urls.slug,
        originalUrl: urls.originalUrl,
        customSlug: urls.customSlug,
        title: urls.title,
        description: urls.description,
        expiresAt: urls.expiresAt,
        createdAt: urls.createdAt,
      })
      .from(urls)
      .where(filter)
      .orderBy(desc(urls.createdAt))
      .limit(perPage)
      .offset(offset),
    db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(urls)
      .where(filter),
  ])

  const total = countResult[0]!.count
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
    throw new UrlFetchError('EXPIRED')
  }

  return toUrlRecord(url)
}

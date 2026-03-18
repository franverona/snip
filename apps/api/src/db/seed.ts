import { nanoid } from 'nanoid'
import { db } from './client.js'
import { type Click, clicks, urls } from './schema.js'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

const CLICK_COUNT = 500
const WINDOW_DAYS = 90

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
]

const REFERERS = ['https://google.com', 'https://twitter.com', 'https://github.com', null, null]

// Clear existing data
await db.delete(clicks)
await db.delete(urls)

console.log('Seeding urls...')

const randomUrls = [
  // edge cases — kept explicit so they're predictable
  {
    originalUrl: 'https://snip.dev/will-expire',
    slug: nanoid(8),
    customSlug: false,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  },
  {
    originalUrl: 'https://snip.dev/is-expired',
    slug: nanoid(8),
    customSlug: false,
    expiresAt: new Date('2020-01-01'),
  },
  { originalUrl: 'https://snip.dev/custom-slug-1', slug: 'custom-1', customSlug: true },
  { originalUrl: 'https://snip.dev/custom-slug-2', slug: 'custom-2', customSlug: true },
  // bulk plain URLs for pagination testing
  ...Array.from({ length: 36 }, (_, i) => ({
    originalUrl: `https://snip.dev/test-${i + 1}`,
    slug: nanoid(8),
    customSlug: false,
  })),
]
  .map((value) => ({ value, sort: Math.random() }))
  .sort((a, b) => a.sort - b.sort)
  .map(({ value }) => value)

const insertedUrls = await db.insert(urls).values(randomUrls).returning()

console.log('Seeding clicks...')

const randomClicks: Pick<Click, 'urlId' | 'clickedAt' | 'userAgent' | 'referer'>[] = []
for (let i = 0; i < CLICK_COUNT; i++) {
  const randomUrl = insertedUrls[Math.floor(Math.random() * insertedUrls.length)]
  if (randomUrl) {
    randomClicks.push({
      urlId: randomUrl.id,
      clickedAt: new Date(Date.now() - Math.random() * WINDOW_DAYS * 24 * 60 * 60 * 1000),
      userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)] ?? null,
      referer: REFERERS[Math.floor(Math.random() * REFERERS.length)] ?? null,
    })
  }
}

await db.insert(clicks).values(randomClicks)

console.log('Seed complete!')

process.exit(0)

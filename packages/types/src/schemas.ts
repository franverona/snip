import { z } from 'zod'

const urlSchema = z.url({
  protocol: /^https?$/,
  hostname: z.regexes.domain,
})

// ---- Input schemas ----

export const CreateUrlInputSchema = z.object({
  originalUrl: urlSchema,
  customSlug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Slug can only contain letters, numbers, hyphens, and underscores')
    .optional(),
  expiresAt: z.iso.datetime().optional(),
})

export const SlugParamSchema = z.object({
  slug: z.string().min(1),
})

// ---- Response schemas ----

export const UrlRecordSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  originalUrl: urlSchema,
  customSlug: z.boolean(),
  expiresAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
})

export const CreateUrlResponseSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  originalUrl: urlSchema,
  customSlug: z.boolean(),
  expiresAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  shortUrl: urlSchema,
})

export const ClickRecordSchema = z.object({
  id: z.uuid(),
  urlId: z.uuid(),
  clickedAt: z.iso.datetime(),
  ipHash: z.string().nullable(),
  userAgent: z.string().nullable(),
  referer: z.string().nullable(),
})

export const UrlStatsSchema = z.object({
  url: UrlRecordSchema,
  totalClicks: z.number().int().nonnegative(),
  clicksByDay: z.array(z.object({ date: z.string(), count: z.number() })),
  clicksLast24h: z.number().int().nonnegative(),
  clicksLast7d: z.number().int().nonnegative(),
  recentClicks: z.array(ClickRecordSchema),
})

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
})

export const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  db: z.enum(['ok', 'error']),
  timestamp: z.iso.datetime(),
})

export const MetaPaginationSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().nonnegative(),
  perPage: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})

export const UrlListSchema = z.object({
  data: z.array(UrlRecordSchema),
  meta: MetaPaginationSchema,
})

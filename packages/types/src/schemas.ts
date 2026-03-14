import { z } from 'zod'

// ---- Input schemas ----

export const CreateUrlInputSchema = z.object({
  originalUrl: z.string().url('Must be a valid URL'),
  customSlug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Slug can only contain letters, numbers, hyphens, and underscores')
    .optional(),
  expiresAt: z.string().datetime().optional(),
})

export const SlugParamSchema = z.object({
  slug: z.string().min(1),
})

// ---- Response schemas ----

export const UrlRecordSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  originalUrl: z.string().url(),
  customSlug: z.boolean(),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
})

export const CreateUrlResponseSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  originalUrl: z.string().url(),
  customSlug: z.boolean(),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  shortUrl: z.string().url(),
})

export const ClickRecordSchema = z.object({
  id: z.string().uuid(),
  urlId: z.string().uuid(),
  clickedAt: z.string().datetime(),
  ipHash: z.string().nullable(),
  userAgent: z.string().nullable(),
  referer: z.string().nullable(),
})

export const UrlStatsSchema = z.object({
  url: UrlRecordSchema,
  totalClicks: z.number().int().nonnegative(),
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
  timestamp: z.string().datetime(),
})

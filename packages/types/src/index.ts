export * from './schemas.js'

// Inferred TypeScript types
import type { z } from 'zod'
import type {
  CreateUrlInputSchema,
  CreateUrlResponseSchema,
  UrlRecordSchema,
  ClickRecordSchema,
  UrlStatsSchema,
  ErrorResponseSchema,
  HealthResponseSchema,
  SlugParamSchema,
} from './schemas.js'

export type CreateUrlInput = z.infer<typeof CreateUrlInputSchema>
export type CreateUrlResponse = z.infer<typeof CreateUrlResponseSchema>
export type UrlRecord = z.infer<typeof UrlRecordSchema>
export type ClickRecord = z.infer<typeof ClickRecordSchema>
export type UrlStats = z.infer<typeof UrlStatsSchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
export type HealthResponse = z.infer<typeof HealthResponseSchema>
export type SlugParam = z.infer<typeof SlugParamSchema>

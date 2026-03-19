import { pgTable, uuid, text, boolean, timestamp, index } from 'drizzle-orm/pg-core'

export const urls = pgTable('urls', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').unique().notNull(),
  originalUrl: text('original_url').notNull(),
  customSlug: boolean('custom_slug').default(false).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const clicks = pgTable(
  'clicks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    urlId: uuid('url_id')
      .notNull()
      .references(() => urls.id, { onDelete: 'cascade' }),
    clickedAt: timestamp('clicked_at', { withTimezone: true }).defaultNow().notNull(),
    ipHash: text('ip_hash'),
    userAgent: text('user_agent'),
    referer: text('referer'),
  },
  (t) => [index('clicks_url_id_clicked_at_idx').on(t.urlId, t.clickedAt)],
)

export type Url = typeof urls.$inferSelect
export type NewUrl = typeof urls.$inferInsert
export type Click = typeof clicks.$inferSelect
export type NewClick = typeof clicks.$inferInsert

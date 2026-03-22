import { lt } from 'drizzle-orm'
import type { FastifyBaseLogger } from 'fastify'
import { db } from './db/client.js'
import { urls } from './db/schema.js'

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

async function deleteExpiredUrls(log: FastifyBaseLogger) {
  const deleted = await db
    .delete(urls)
    .where(lt(urls.expiresAt, new Date()))
    .returning({ id: urls.id })
  if (deleted.length > 0) {
    log.info({ count: deleted.length }, 'deleted expired URLs')
  }
}

export function startScheduler(log: FastifyBaseLogger): ReturnType<typeof setInterval> {
  // Run once immediately on startup, then every hour
  deleteExpiredUrls(log).catch((err) => log.error({ err }, 'expired URL cleanup failed'))

  return setInterval(() => {
    deleteExpiredUrls(log).catch((err) => log.error({ err }, 'expired URL cleanup failed'))
  }, CLEANUP_INTERVAL_MS)
}

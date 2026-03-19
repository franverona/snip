import type { FastifyInstance } from 'fastify'
import { findUrlBySlug, recordClick } from '../services/url.service.js'
import { createHmac } from 'node:crypto'
import { env } from '../config.js'

export async function redirectRoutes(fastify: FastifyInstance) {
  // GET /:slug — redirect
  fastify.get<{ Params: { slug: string } }>('/:slug', async (request, reply) => {
    const { slug } = request.params

    const url = await findUrlBySlug(slug)

    if (!url) {
      return reply.status(404).send({ error: 'URL not found' })
    }

    if (url.expiresAt && url.expiresAt < new Date()) {
      return reply
        .status(410)
        .headers({
          'cache-control': 'public, max-age=60',
        })
        .send({ error: 'URL has expired' })
    }

    // Fire-and-forget click recording
    const ip = request.ip
    const ipHash = ip
      ? createHmac('sha256', env.IP_HASH_SECRET).update(ip).digest('hex')
      : undefined

    setImmediate(() => {
      recordClick(url.id, {
        ipHash,
        userAgent: request.headers['user-agent'] ?? undefined,
        referer: request.headers['referer'] ?? undefined,
      }).catch(() => {
        // ignore click recording errors
      })
    })

    return reply
      .headers({
        'cache-control': url.expiresAt ? 'no-store' : 'public, max-age=3600',
      })
      .redirect(url.originalUrl, url.expiresAt ? 302 : 301)
  })
}

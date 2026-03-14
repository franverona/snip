import type { FastifyInstance } from 'fastify'
import { findUrlBySlug, recordClick } from '../services/url.service.js'
import { createHash } from 'crypto'

export async function redirectRoutes(fastify: FastifyInstance) {
  // GET /:slug — redirect
  fastify.get<{ Params: { slug: string } }>('/:slug', async (request, reply) => {
    const { slug } = request.params

    const url = await findUrlBySlug(slug)

    if (!url) {
      return reply.status(404).send({ error: 'URL not found' })
    }

    if (url.expiresAt && url.expiresAt < new Date()) {
      return reply.status(410).send({ error: 'URL has expired' })
    }

    // Fire-and-forget click recording
    const ip = request.ip
    const ipHash = ip ? createHash('sha256').update(ip).digest('hex') : undefined

    setImmediate(() => {
      recordClick(url.id, {
        ipHash,
        userAgent: request.headers['user-agent'] ?? undefined,
        referer: request.headers['referer'] ?? undefined,
      }).catch(() => {
        // ignore click recording errors
      })
    })

    return reply.redirect(url.originalUrl, 302)
  })
}

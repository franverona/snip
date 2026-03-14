import type { FastifyInstance } from 'fastify'
import { CreateUrlInputSchema } from '@snip/types'
import { createUrl, getUrlStats, deleteUrl } from '../services/url.service.js'
import { env } from '../config.js'

export async function urlRoutes(fastify: FastifyInstance) {
  // POST /urls — create short URL
  fastify.post('/urls', async (request, reply) => {
    const parsed = CreateUrlInputSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation error',
        message: parsed.error.issues.map((i) => i.message).join(', '),
      })
    }

    try {
      const result = await createUrl(parsed.data, env.BASE_URL)
      return reply.status(201).send(result)
    } catch (err) {
      if (err instanceof Error && err.message === 'SLUG_TAKEN') {
        return reply.status(409).send({ error: 'Slug already taken' })
      }
      throw err
    }
  })

  // GET /urls/:slug/stats
  fastify.get<{ Params: { slug: string } }>('/urls/:slug/stats', async (request, reply) => {
    const { slug } = request.params
    const stats = await getUrlStats(slug)
    if (!stats) {
      return reply.status(404).send({ error: 'URL not found' })
    }
    return reply.send(stats)
  })

  // DELETE /urls/:slug
  fastify.delete<{ Params: { slug: string } }>('/urls/:slug', async (request, reply) => {
    const { slug } = request.params
    const deleted = await deleteUrl(slug)
    if (!deleted) {
      return reply.status(404).send({ error: 'URL not found' })
    }
    return reply.status(204).send()
  })
}

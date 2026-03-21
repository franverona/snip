import type { FastifyInstance } from 'fastify'
import { CreateUrlInputSchema } from '@snip/types'
import {
  createUrl,
  getUrlStats,
  deleteUrl,
  getUrlList,
  getUrlPreview,
} from '../services/url.service.js'
import { env } from '../config.js'
import { parsePagination } from '../lib/pagination.js'
import { requireApiKey } from '../lib/api-key.js'

export async function urlRoutes(fastify: FastifyInstance) {
  // GET /urls — lists created URLs
  fastify.get<{ Querystring: { page?: number; perPage?: number } }>(
    '/urls',
    {
      preHandler: [requireApiKey],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1 },
            perPage: { type: 'integer', minimum: 1, maximum: 50 },
          },
        },
      },
    },
    async (request, reply) => {
      const { page, perPage, offset } = parsePagination(request.query)
      const { data, meta } = await getUrlList(page, perPage, offset)
      return reply.send({
        data: data.map((url) => ({
          ...url,
          shortUrl: `${env.BASE_URL}/${url.slug}`,
        })),
        meta,
      })
    },
  )

  // POST /urls — create short URL
  fastify.post(
    '/urls',
    {
      preHandler: [requireApiKey],
      config: {
        rateLimit: {
          max: env.RATE_LIMIT_CREATE_PER_MINUTE,
        },
      },
    },
    async (request, reply) => {
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
        if (err instanceof Error) {
          switch (err.message) {
            case 'REDIRECT_LOOP':
              return reply
                .status(400)
                .send({ error: 'Cannot shorten a URL pointing to this service' })
            case 'SLUG_TAKEN':
              return reply.status(409).send({ error: 'Slug already taken' })
            case 'UNRESOLVED_DNS':
              return reply.status(422).send({ error: 'URL hostname could not be resolved' })
            case 'PRIVATE_ADDRESS':
              return reply
                .status(400)
                .send({ error: 'URL resolves to a private or reserved address' })
          }
        }
        throw err
      }
    },
  )

  // GET /urls/:slug/stats
  fastify.get<{ Params: { slug: string } }>(
    '/urls/:slug/stats',
    { preHandler: [requireApiKey] },
    async (request, reply) => {
      const { slug } = request.params
      const stats = await getUrlStats(slug, env.BASE_URL)
      if (!stats) {
        return reply.status(404).send({ error: 'URL not found' })
      }
      return reply.send(stats)
    },
  )

  // DELETE /urls/:slug
  fastify.delete<{ Params: { slug: string } }>(
    '/urls/:slug',
    { preHandler: [requireApiKey] },
    async (request, reply) => {
      const { slug } = request.params
      const deleted = await deleteUrl(slug)
      if (!deleted) {
        return reply.status(404).send({ error: 'URL not found' })
      }
      return reply.status(204).send()
    },
  )

  // GET /preview/:slug
  fastify.get<{ Params: { slug: string } }>(
    '/preview/:slug',
    { preHandler: [requireApiKey] },
    async (request, reply) => {
      const { slug } = request.params
      try {
        const url = await getUrlPreview(slug)
        if (!url) {
          return reply.status(404).send({ error: 'URL not found' })
        }

        return reply.send(url)
      } catch (err) {
        if (err instanceof Error) {
          switch (err.message) {
            case 'EXPIRED':
              return reply.status(410).send({ error: 'URL is expired' })
          }
        }
        throw err
      }
    },
  )
}

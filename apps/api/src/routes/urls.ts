import type { FastifyInstance } from 'fastify'
import { CreateUrlInputSchema, BulkDeleteUrlsInputSchema } from '@snip/types'
import {
  createUrl,
  getUrlStats,
  deleteUrl,
  deleteUrls,
  getUrlList,
  getUrlPreview,
  UrlFetchError,
} from '../services/url.service.js'
import { env } from '../config.js'
import { parsePagination } from '../lib/pagination.js'
import { requireApiKey } from '../lib/api-key.js'

// Reflects actual runtime behaviour: when API_KEY is unset the endpoints are public.
const routeSecurity = env.API_KEY ? [{ bearerAuth: [] }] : []

export async function urlRoutes(fastify: FastifyInstance) {
  // GET /urls — lists created URLs
  fastify.get<{ Querystring: { page?: number; perPage?: number; q?: string } }>(
    '/urls',
    {
      preHandler: [requireApiKey],
      schema: {
        tags: ['URLs'],
        summary: 'List short URLs',
        security: routeSecurity,
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, description: 'Page number (default: 1)' },
            perPage: {
              type: 'integer',
              minimum: 1,
              maximum: 50,
              description: 'Results per page (default: 20, max: 50)',
            },
            q: {
              type: 'string',
              description: 'Search query — filters by slug, title, or original URL',
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { page, perPage, offset } = parsePagination(request.query)
      const { data, meta } = await getUrlList(page, perPage, offset, request.query.q)
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
      attachValidation: true,
      config: {
        rateLimit: {
          max: env.RATE_LIMIT_CREATE_PER_MINUTE,
        },
      },
      schema: {
        tags: ['URLs'],
        summary: 'Create a short URL',
        security: routeSecurity,
        body: {
          type: 'object',
          required: ['originalUrl'],
          properties: {
            originalUrl: { type: 'string', format: 'uri', description: 'The URL to shorten' },
            customSlug: { type: 'string', description: 'Custom slug (random if omitted)' },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'Expiry timestamp in ISO 8601 format',
            },
            title: {
              type: 'string',
              maxLength: 200,
              description: 'Custom title — overrides scraped page title',
            },
            description: {
              type: 'string',
              maxLength: 500,
              description: 'Custom description — overrides scraped page description',
            },
            allowDuplicate: {
              type: 'boolean',
              description:
                'When true, skips duplicate detection and always creates a new short URL',
            },
          },
        },
        response: {
          200: {
            description: 'URL already shortened — existing short URL returned',
            type: 'object',
            properties: {
              slug: { type: 'string' },
              shortUrl: { type: 'string' },
              originalUrl: { type: 'string' },
              title: { type: 'string', nullable: true },
              description: { type: 'string', nullable: true },
              expiresAt: { type: 'string', format: 'date-time', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              existing: { type: 'boolean' },
            },
          },
          201: {
            description: 'Short URL created',
            type: 'object',
            properties: {
              slug: { type: 'string' },
              shortUrl: { type: 'string' },
              originalUrl: { type: 'string' },
              title: { type: 'string', nullable: true },
              description: { type: 'string', nullable: true },
              expiresAt: { type: 'string', format: 'date-time', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          400: {
            description: 'Validation error, redirect loop, or private address',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          409: {
            description: 'Slug already taken',
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          422: {
            description: 'URL hostname could not be resolved',
            type: 'object',
            properties: { error: { type: 'string' } },
          },
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
        return reply.status(result.existing ? 200 : 201).send(result)
      } catch (err) {
        if (err instanceof UrlFetchError) {
          switch (err.code) {
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
            case 'EXPIRED':
              break
          }
        }
        throw err
      }
    },
  )

  // GET /urls/:slug/stats
  fastify.get<{ Params: { slug: string } }>(
    '/urls/:slug/stats',
    {
      preHandler: [requireApiKey],
      schema: {
        tags: ['URLs'],
        summary: 'Get URL statistics',
        security: routeSecurity,
        params: {
          type: 'object',
          properties: { slug: { type: 'string', description: 'Short URL slug' } },
        },
      },
    },
    async (request, reply) => {
      const { slug } = request.params
      const stats = await getUrlStats(slug, env.BASE_URL)
      if (!stats) {
        return reply.status(404).send({ error: 'URL not found' })
      }
      return reply.send(stats)
    },
  )

  // DELETE /urls — bulk delete
  fastify.delete(
    '/urls',
    {
      preHandler: [requireApiKey],
      config: {
        rateLimit: {
          max: env.RATE_LIMIT_BULK_DELETE_PER_MINUTE,
        },
      },
      schema: {
        tags: ['URLs'],
        summary: 'Bulk delete short URLs',
        description: 'Deletes multiple short URLs by slug. Returns the count of deleted URLs.',
        security: routeSecurity,
        body: {
          type: 'object',
          required: ['slugs'],
          properties: {
            slugs: {
              type: 'array',
              items: { type: 'string', minLength: 1 },
              minItems: 1,
              maxItems: 100,
              description: 'List of slugs to delete (1–100)',
            },
          },
        },
        response: {
          200: {
            description: 'Number of URLs deleted',
            type: 'object',
            properties: { deleted: { type: 'integer', minimum: 0 } },
          },
          400: {
            description: 'Validation error',
            type: 'object',
            properties: { error: { type: 'string' }, message: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = BulkDeleteUrlsInputSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation error',
          message: parsed.error.issues.map((i) => i.message).join(', '),
        })
      }
      const result = await deleteUrls(parsed.data.slugs)
      return reply.send(result)
    },
  )

  // DELETE /urls/:slug
  fastify.delete<{ Params: { slug: string } }>(
    '/urls/:slug',
    {
      preHandler: [requireApiKey],
      schema: {
        tags: ['URLs'],
        summary: 'Delete a short URL',
        security: routeSecurity,
        params: {
          type: 'object',
          properties: { slug: { type: 'string', description: 'Short URL slug' } },
        },
        response: { 204: { type: 'null', description: 'Deleted' } },
      },
    },
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
    {
      preHandler: [requireApiKey],
      schema: {
        tags: ['URLs'],
        summary: 'Preview a short URL',
        description: 'Returns URL metadata without redirecting.',
        security: routeSecurity,
        params: {
          type: 'object',
          properties: { slug: { type: 'string', description: 'Short URL slug' } },
        },
      },
    },
    async (request, reply) => {
      const { slug } = request.params
      try {
        const url = await getUrlPreview(slug)
        if (!url) {
          return reply.status(404).send({ error: 'URL not found' })
        }

        return reply.send(url)
      } catch (err) {
        if (err instanceof UrlFetchError) {
          switch (err.code) {
            case 'EXPIRED':
              return reply.status(410).send({ error: 'URL is expired' })
            case 'REDIRECT_LOOP':
            case 'UNRESOLVED_DNS':
            case 'PRIVATE_ADDRESS':
            case 'SLUG_TAKEN':
              break
          }
        }
        throw err
      }
    },
  )
}

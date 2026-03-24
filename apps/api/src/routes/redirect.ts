import type { FastifyInstance } from 'fastify'
import { findUrlBySlug, recordClick } from '../services/url.service.js'
import { createHmac } from 'node:crypto'
import { env } from '../config.js'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildOgPage(
  originalUrl: string,
  title: string | null,
  description: string | null,
): string {
  const safeUrl = escapeHtml(originalUrl)
  const safeTitle = escapeHtml(title ?? originalUrl)
  const jsUrl = JSON.stringify(originalUrl)

  let metaTags = `  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${safeUrl}">
  <link rel="canonical" href="${safeUrl}">
  <meta property="og:url" content="${safeUrl}">
  <meta property="og:title" content="${safeTitle}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${safeTitle}">`

  if (description) {
    const safeDesc = escapeHtml(description)
    metaTags += `
  <meta property="og:description" content="${safeDesc}">
  <meta name="twitter:description" content="${safeDesc}">`
  }

  metaTags += `
  <title>${safeTitle}</title>`

  return `<!DOCTYPE html>
<html>
<head>
${metaTags}
</head>
<body>
<script>location.replace(${jsUrl})</script>
</body>
</html>`
}

export async function redirectRoutes(fastify: FastifyInstance) {
  // GET /:slug — serve OG meta page that immediately redirects human visitors
  fastify.get<{ Params: { slug: string } }>(
    '/:slug',
    {
      schema: {
        tags: ['Redirect'],
        summary: 'Redirect to original URL',
        description:
          'Serves an HTML page with OG meta tags and a meta-refresh redirect to the original URL. Click is recorded fire-and-forget.',
        params: {
          type: 'object',
          properties: { slug: { type: 'string', description: 'Short URL slug' } },
        },
        response: {
          200: {
            description: 'HTML redirect page with OG meta tags',
            type: 'string',
          },
          404: {
            description: 'Slug not found',
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          410: {
            description: 'URL has expired',
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
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
        }).catch((err) => {
          fastify.log.error({ err }, 'Failed to record click')
        })
      })

      return reply
        .headers({
          'content-type': 'text/html; charset=utf-8',
          'cache-control': url.expiresAt ? 'no-store' : 'public, max-age=3600',
        })
        .status(200)
        .send(buildOgPage(url.originalUrl, url.title, url.description))
    },
  )
}

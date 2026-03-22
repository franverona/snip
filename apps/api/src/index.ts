import Fastify from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import ScalarApiReference from '@scalar/fastify-api-reference'
import { env } from './config.js'
import { healthRoutes } from './routes/health.js'
import { urlRoutes } from './routes/urls.js'
import { redirectRoutes } from './routes/redirect.js'
import { startScheduler } from './scheduler.js'

const fastify = Fastify({ logger: true })
await fastify.register(import('@fastify/rate-limit'), {
  global: true,
  max: 120,
  timeWindow: '1 minute',
  allowList: (request) => request.url.startsWith('/docs'),
})

await fastify.register(cors, {
  origin: env.CORS_ORIGIN ?? env.BASE_URL,
})

await fastify.register(swagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Snip API',
      description: 'URL shortener API',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description:
            'API key via `Authorization: Bearer <key>`. Only enforced when the `API_KEY` env var is set — omit entirely when running without one.',
        },
      },
    },
  },
})

await fastify.register(healthRoutes)
await fastify.register(urlRoutes)
await fastify.register(ScalarApiReference, { routePrefix: '/docs' })
// Redirect must be last (wildcard /:slug)
await fastify.register(redirectRoutes)

const SHUTDOWN_TIMEOUT_MS = 10_000
let schedulerInterval: ReturnType<typeof setInterval> | undefined

async function shutdown(signal: string) {
  fastify.log.info({ signal }, 'shutdown signal received')

  const timer = setTimeout(() => {
    fastify.log.warn('graceful shutdown timed out — forcing exit')
    process.exit(1)
  }, SHUTDOWN_TIMEOUT_MS)
  timer.unref()

  if (schedulerInterval !== undefined) clearInterval(schedulerInterval)
  await fastify.close()
  clearTimeout(timer)
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

try {
  await fastify.listen({ port: env.PORT, host: '0.0.0.0' })
  console.log(`API running on port ${env.PORT}`)
  schedulerInterval = startScheduler(fastify.log)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}

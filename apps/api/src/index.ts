import Fastify from 'fastify'
import cors from '@fastify/cors'
import { env } from './config.js'
import { healthRoutes } from './routes/health.js'
import { urlRoutes } from './routes/urls.js'
import { redirectRoutes } from './routes/redirect.js'

const fastify = Fastify({ logger: true })
await fastify.register(import('@fastify/rate-limit'), {
  global: true,
  max: 120,
  timeWindow: '1 minute',
})

await fastify.register(cors, {
  origin: env.CORS_ORIGIN ?? env.BASE_URL,
})

await fastify.register(healthRoutes)
await fastify.register(urlRoutes)
// Redirect must be last (wildcard /:slug)
await fastify.register(redirectRoutes)

const shutdown = async () => {
  try {
    await fastify.close()
    process.exit(0)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

try {
  await fastify.listen({ port: env.PORT, host: '0.0.0.0' })
  console.log(`API running on port ${env.PORT}`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}

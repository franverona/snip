import Fastify from 'fastify'
import cors from '@fastify/cors'
import { env } from './config.js'
import { healthRoutes } from './routes/health.js'
import { urlRoutes } from './routes/urls.js'
import { redirectRoutes } from './routes/redirect.js'

const fastify = Fastify({ logger: true })

await fastify.register(cors, { origin: true })

await fastify.register(healthRoutes)
await fastify.register(urlRoutes)
// Redirect must be last (wildcard /:slug)
await fastify.register(redirectRoutes)

try {
  await fastify.listen({ port: env.PORT, host: '0.0.0.0' })
  console.log(`API running on port ${env.PORT}`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}

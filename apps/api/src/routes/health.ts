import type { FastifyInstance } from 'fastify'
import { checkDbConnection } from '../db/client.js'

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (_request, reply) => {
    const dbOk = await checkDbConnection()
    const status = dbOk ? 'ok' : 'error'
    return reply.status(dbOk ? 200 : 503).send({
      status,
      db: status,
      timestamp: new Date().toISOString(),
    })
  })
}

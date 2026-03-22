import type { FastifyInstance } from 'fastify'
import { checkDbConnection } from '../db/client.js'

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/health',
    {
      schema: {
        tags: ['System'],
        summary: 'Health check',
        description: 'Returns API and database status.',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['ok'] },
              db: { type: 'string', enum: ['ok'] },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
          503: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['error'] },
              db: { type: 'string', enum: ['error'] },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const dbOk = await checkDbConnection()
      const status = dbOk ? 'ok' : 'error'
      return reply.status(dbOk ? 200 : 503).send({
        status,
        db: status,
        timestamp: new Date().toISOString(),
      })
    },
  )
}

import type { FastifyReply, FastifyRequest } from 'fastify'
import { env } from '../config.js'

export async function requireApiKey(request: FastifyRequest, reply: FastifyReply) {
  if (!env.API_KEY) return
  const auth = request.headers['authorization']
  if (auth !== `Bearer ${env.API_KEY}`) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
}

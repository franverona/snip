import { timingSafeEqual } from 'node:crypto'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { env } from '../config.js'

export async function requireApiKey(request: FastifyRequest, reply: FastifyReply) {
  if (!env.API_KEY) return
  const auth = request.headers['authorization']
  const provided = Buffer.from(auth ?? '')
  const expected = Buffer.from(`Bearer ${env.API_KEY}`)
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
}

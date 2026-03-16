import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import { healthRoutes } from './health.js'

vi.mock('../db/client.js')

import { checkDbConnection } from '../db/client.js'

let app: FastifyInstance

beforeEach(async () => {
  vi.clearAllMocks()
  app = Fastify({ logger: false })
  await app.register(healthRoutes)
})

afterEach(async () => {
  await app.close()
})

describe('GET /health', () => {
  it('returns 200 with ok status when DB is healthy', async () => {
    vi.mocked(checkDbConnection).mockResolvedValue(true)

    const res = await app.inject({ method: 'GET', url: '/health' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.status).toBe('ok')
    expect(body.db).toBe('ok')
    expect(body.timestamp).toBeTruthy()
  })

  it('returns 503 with error status when DB is unhealthy', async () => {
    vi.mocked(checkDbConnection).mockResolvedValue(false)

    const res = await app.inject({ method: 'GET', url: '/health' })

    expect(res.statusCode).toBe(503)
    const body = res.json()
    expect(body.status).toBe('error')
    expect(body.db).toBe('error')
  })
})

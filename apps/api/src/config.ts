import { config } from 'dotenv'

config()

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export const env = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  DATABASE_POOL_MAX: parseInt(process.env['DATABASE_POOL_MAX'] ?? '10', 10),
  PORT: parseInt(process.env['PORT'] ?? '3001', 10),
  BASE_URL: process.env['BASE_URL'] ?? 'http://localhost:3001',
  RATE_LIMIT_CREATE_PER_MINUTE: parseInt(process.env['RATE_LIMIT_CREATE_PER_MINUTE'] ?? '10', 10),
  CORS_ORIGIN: process.env['CORS_ORIGIN'],
  IP_HASH_SECRET: requireEnv('IP_HASH_SECRET'),
  API_KEY: process.env['API_KEY'],
}

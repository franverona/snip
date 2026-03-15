import { config } from 'dotenv'

config()

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export const env = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  PORT: parseInt(process.env['PORT'] ?? '3001', 10),
  BASE_URL: process.env['BASE_URL'] ?? 'http://localhost:3001',
  RATE_LIMIT_CREATE_PER_MINUTE: parseInt(process.env['RATE_LIMIT_CREATE_PER_MINUTE'] ?? '10', 10),
}

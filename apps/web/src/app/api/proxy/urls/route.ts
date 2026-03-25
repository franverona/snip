import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const API_URL =
  process.env['API_URL'] ?? process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'
const API_KEY = process.env['API_KEY']

const MAX_BODY_BYTES = 1_048_576 // 1 MB — matches Fastify's default bodyLimit

function isBodyTooLarge(request: NextRequest): boolean {
  const contentLength = request.headers.get('content-length')
  return contentLength !== null && parseInt(contentLength, 10) > MAX_BODY_BYTES
}

export async function POST(request: NextRequest) {
  if (isBodyTooLarge(request)) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`

  const body = await request.text()
  const res = await fetch(`${API_URL}/urls`, { method: 'POST', headers, body })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function DELETE(request: NextRequest) {
  if (isBodyTooLarge(request)) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`

  const body = await request.text()
  const res = await fetch(`${API_URL}/urls`, { method: 'DELETE', headers, body })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

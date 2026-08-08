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

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const headers: Record<string, string> = {}
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`

  const res = await fetch(`${API_URL}/urls/${slug}`, { method: 'DELETE', headers })
  if (res.status === 204) return new NextResponse(null, { status: 204 })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (isBodyTooLarge(request)) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
  }

  const { slug } = await params
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`

  const body = await request.text()
  const res = await fetch(`${API_URL}/urls/${slug}`, { method: 'PATCH', headers, body })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

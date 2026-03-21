import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const API_URL =
  process.env['API_URL'] ?? process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'
const API_KEY = process.env['API_KEY']

export async function POST(request: NextRequest) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`

  const body = await request.text()
  const res = await fetch(`${API_URL}/urls`, { method: 'POST', headers, body })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

import type { CreateUrlInput, CreateUrlResponse, UrlList, UrlStats } from '@snip/types'

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = {
    ...(init?.method !== 'DELETE' ? { 'Content-Type': 'application/json' } : {}),
    ...init?.headers,
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...init,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, (body as { error?: string }).error ?? res.statusText)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const api = {
  getUrls: (page: number, perPage: number): Promise<UrlList> =>
    apiFetch(`/urls?page=${page}&perPage=${perPage}`),

  createUrl: (input: CreateUrlInput): Promise<CreateUrlResponse> =>
    apiFetch('/urls', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  getStats: (slug: string): Promise<UrlStats> => apiFetch(`/urls/${slug}/stats`),

  deleteUrl: (slug: string): Promise<void> => apiFetch(`/urls/${slug}`, { method: 'DELETE' }),
}

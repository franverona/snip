export const SESSION_COOKIE = 'snip-auth'

export async function computeSessionToken(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`${password}:snip-session-v1`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

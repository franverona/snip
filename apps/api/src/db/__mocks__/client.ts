import { vi } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = {} as any
export const checkDbConnection = vi.fn<() => Promise<boolean>>()

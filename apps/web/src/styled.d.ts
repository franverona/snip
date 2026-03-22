import type { AppTheme } from './lib/theme'

declare module 'styled-components' {
  export type DefaultTheme = AppTheme
}

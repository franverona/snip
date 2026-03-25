import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
})

// jsdom doesn't implement HTMLCanvasElement.getContext — silence the noise from qrcode.react
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => null
}

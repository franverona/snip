import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
})

// jsdom doesn't implement canvas APIs — silence the noise from qrcode.react
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => null
  HTMLCanvasElement.prototype.toDataURL = () => ''
}

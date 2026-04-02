// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QRCodeCanvas } from 'qrcode.react'
import { QRDownloadButton } from './QRDownloadButton'

vi.mock('qrcode.react', () => ({
  QRCodeCanvas: vi.fn(
    ({ ref, ...props }: Record<string, unknown> & { ref?: React.Ref<HTMLCanvasElement> }) => (
      <canvas ref={ref} data-testid="qr-code-canvas" data-props={JSON.stringify(props)} />
    ),
  ),
}))

describe('QRDownloadButton', () => {
  afterEach(() => vi.restoreAllMocks())

  it('should render', () => {
    render(
      <QRDownloadButton value="https://example.com/qr" slug="test-slug" className="test-class" />,
    )
    const qrCodeCanvas = screen.getByTestId('qr-code-canvas')
    const props = JSON.parse(qrCodeCanvas.getAttribute('data-props') || '{}')
    expect(props.value).toBe('https://example.com/qr')

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button.className).toBe('test-class')
  })

  it('should skip download if canvas is not rendered', () => {
    vi.mocked(QRCodeCanvas).mockReturnValueOnce(null)
    const createElementSpy = vi.spyOn(document, 'createElement')

    render(<QRDownloadButton value="https://example.com/qr" slug="test-slug" />)
    fireEvent.click(screen.getByRole('button'))

    expect(createElementSpy).not.toHaveBeenCalledWith('a')
  })

  it('should download file named with slug and date', () => {
    const mockLink = { click: vi.fn(), download: '', href: '' }
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return mockLink as unknown as HTMLElement
      return originalCreateElement(tag)
    })

    render(<QRDownloadButton value="https://example.com/qr" slug="test-slug" />)
    fireEvent.click(screen.getByRole('button'))

    expect(mockLink.download).toMatch(/^test-slug-\d{4}-\d{2}-\d{2}\.png$/)
    expect(mockLink.click).toHaveBeenCalled()
  })

  it('should download file named with title and date', () => {
    const mockLink = { click: vi.fn(), download: '', href: '' }
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return mockLink as unknown as HTMLElement
      return originalCreateElement(tag)
    })

    render(<QRDownloadButton value="https://example.com/qr" slug="test-slug" title="Test Title" />)
    fireEvent.click(screen.getByRole('button'))

    expect(mockLink.download).toMatch(/^Test-Title-\d{4}-\d{2}-\d{2}\.png$/)
    expect(mockLink.click).toHaveBeenCalled()
  })

  it('should trim title if too large', () => {
    const mockLink = { click: vi.fn(), download: '', href: '' }
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return mockLink as unknown as HTMLElement
      return originalCreateElement(tag)
    })

    const title = Array.from({ length: 100 }, () => 'a').join('')
    render(<QRDownloadButton value="https://example.com/qr" slug="test-slug" title={title} />)
    fireEvent.click(screen.getByRole('button'))

    expect(mockLink.download).toMatch(
      /^aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-\d{4}-\d{2}-\d{2}\.png$/,
    )
    expect(mockLink.click).toHaveBeenCalled()
  })

  it('should parse title if it contains wrong characters', () => {
    const mockLink = { click: vi.fn(), download: '', href: '' }
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return mockLink as unknown as HTMLElement
      return originalCreateElement(tag)
    })

    render(<QRDownloadButton value="https://example.com/qr" slug="test-slug" title="test,.-12á" />)
    fireEvent.click(screen.getByRole('button'))

    expect(mockLink.download).toMatch(/^test-12-\d{4}-\d{2}-\d{2}\.png$/)
    expect(mockLink.click).toHaveBeenCalled()
  })
})

'use client'

import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'

interface Props {
  value: string
  slug: string
  title?: string | null
  children?: React.ReactNode
  className?: string
}

export function QRDownloadButton({
  value,
  slug,
  title,
  children = 'Download QR',
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const label = title ? title.slice(0, 40).replace(/[^a-z0-9]/gi, '-') : slug
    const date = new Date().toISOString().slice(0, 10)
    const link = document.createElement('a')
    link.download = `${label}-${date}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <>
      <QRCodeCanvas
        ref={canvasRef}
        height={256}
        width={256}
        value={value}
        style={{ display: 'none' }}
      />
      <button className={className} onClick={handleDownload}>
        {children}
      </button>
    </>
  )
}

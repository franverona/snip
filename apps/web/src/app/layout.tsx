import type { Metadata } from 'next'
import './globals.css'
import { StyledComponentsRegistry } from '@/lib/StyledComponentsRegistry'
import { Header } from '@/components/Header'
import { ToastProvider } from '@/components/Toast'

export const metadata: Metadata = {
  title: 'Snip — URL Shortener',
  description: 'Shorten URLs quickly',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const hasPassword = !!process.env['DASHBOARD_PASSWORD']
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <Header hasPassword={hasPassword} />
          <ToastProvider>
            <main
              style={{
                maxWidth: 720,
                margin: '0 auto',
                padding: '2.5rem 1rem',
              }}
            >
              {children}
            </main>
          </ToastProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}

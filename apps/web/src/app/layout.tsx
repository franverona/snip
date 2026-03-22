import type { Metadata } from 'next'
import './globals.css'
import { StyledComponentsRegistry } from '@/lib/StyledComponentsRegistry'
import { ThemeModeProvider } from '@/lib/ThemeContext'
import { Header } from '@/components/Header'
import { ToastProvider } from '@/components/Toast'

export const metadata: Metadata = {
  title: 'Snip — URL Shortener',
  description: 'Shorten URLs quickly',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const hasPassword = !!process.env['DASHBOARD_PASSWORD']
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('snip-theme');var dark=s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light';})();`,
          }}
        />
      </head>
      <body>
        <StyledComponentsRegistry>
          <ThemeModeProvider>
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
          </ThemeModeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}

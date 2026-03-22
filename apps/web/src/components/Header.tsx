'use client'

import styled from 'styled-components'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useThemeMode } from '@/lib/ThemeContext'

const Nav = styled.header`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
`

const Inner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 720px;
  margin: 0 auto;
  padding: 0.5rem 1rem;
`

const Logo = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Menu = styled.div`
  display: flex;
  align-items: center;
`

const MenuItem = styled(Link)<{ $active: boolean }>`
  padding: 0.5rem 0.825rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.textMuted)};
  border-radius: 4px;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
    background-color: ${({ theme }) => theme.colors.navMenuItemHoverBg};
  }

  @media (max-width: 480px) {
    padding: 0.5rem 0.5rem;
    font-size: 0.8125rem;
  }
`

const links = [
  {
    label: 'URLs',
    href: '/urls',
  },
  {
    label: 'Shorten a URL',
    href: '/new',
  },
]

const LogoutLink = styled.a`
  padding: 0.5rem 0.825rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
    background-color: ${({ theme }) => theme.colors.navMenuItemHoverBg};
  }
`

const ThemeToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceHover};
  border-radius: 6px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-left: 0.5rem;
  transition:
    color 0.15s,
    background 0.15s,
    border-color 0.15s;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
    background-color: ${({ theme }) => theme.colors.accentBg};
    border-color: ${({ theme }) => theme.colors.accentBorder};
  }
`

// Both icons are always rendered; CSS toggles which is visible based on data-theme.
// This avoids any server/client hydration mismatch from mode-dependent rendering.
const SunIconWrapper = styled.span`
  display: none;
  html[data-theme='dark'] & {
    display: contents;
  }
`

const MoonIconWrapper = styled.span`
  display: contents;
  html[data-theme='dark'] & {
    display: none;
  }
`

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}

export function Header({ hasPassword = false }: { hasPassword?: boolean }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'
  const { toggle } = useThemeMode()

  return (
    <Nav>
      <Inner>
        <Logo href="/">
          <Image src="/scissors.svg" alt="" width={20} height={20} />
          snip
        </Logo>
        <Menu>
          {!isLoginPage &&
            links.map(({ label, href }) => (
              <MenuItem key={href} $active={pathname === href} href={href}>
                {label}
              </MenuItem>
            ))}
          {hasPassword && !isLoginPage && <LogoutLink href="/logout">Sign out</LogoutLink>}
          <ThemeToggle onClick={toggle} aria-label="Toggle theme">
            <SunIconWrapper>
              <SunIcon />
            </SunIconWrapper>
            <MoonIconWrapper>
              <MoonIcon />
            </MoonIconWrapper>
          </ThemeToggle>
        </Menu>
      </Inner>
    </Nav>
  )
}

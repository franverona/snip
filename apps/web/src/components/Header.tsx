'use client'

import styled from 'styled-components'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const Nav = styled.header`
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
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
  color: #111827;
  text-decoration: none;

  &:hover {
    color: #2563eb;
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
  color: ${({ $active }) => ($active ? '#2563eb' : '#6b7688')};
  border-radius: 4px;
  white-space: nowrap;

  &:hover {
    color: #2563eb;
    background-color: #f6f8fe;
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
  color: #6b7688;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    color: #2563eb;
    background-color: #f6f8fe;
  }
`

export function Header({ hasPassword = false }: { hasPassword?: boolean }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'
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
        </Menu>
      </Inner>
    </Nav>
  )
}

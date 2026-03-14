'use client'

import styled from 'styled-components'
import Link from 'next/link'

const Nav = styled.header`
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
`

const Inner = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 1rem;
`

const Logo = styled(Link)`
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #111827;
  text-decoration: none;

  &:hover {
    color: #2563eb;
  }
`

export function Header() {
  return (
    <Nav>
      <Inner>
        <Logo href="/">✂️ snip</Logo>
      </Inner>
    </Nav>
  )
}

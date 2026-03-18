'use client'

import styled from 'styled-components'
import Link from 'next/link'
import Image from 'next/image'

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

export function Header() {
  return (
    <Nav>
      <Inner>
        <Logo href="/">
          <Image src="/scissors.svg" alt="" width={20} height={20} />
          snip
        </Logo>
      </Inner>
    </Nav>
  )
}

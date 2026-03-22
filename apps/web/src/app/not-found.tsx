'use client'

import styled from 'styled-components'

const Wrapper = styled.div`
  text-align: center;
  padding: 4rem 0;
`

const Heading = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`

const Message = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 1.5rem;
`

const BackLink = styled.a`
  color: ${({ theme }) => theme.colors.accent};
`

export default function NotFound() {
  return (
    <Wrapper>
      <Heading>404</Heading>
      <Message>That short URL does not exist.</Message>
      <BackLink href="/">← Back to home</BackLink>
    </Wrapper>
  )
}

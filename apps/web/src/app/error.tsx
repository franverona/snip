'use client'

import styled from 'styled-components'
import { useEffect } from 'react'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;
  text-align: center;
  padding: 2rem 1rem;
`

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`

const Message = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  max-width: 360px;
`

const RetryButton = styled.button`
  margin-top: 0.5rem;
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accent};
  background: ${({ theme }) => theme.colors.accentBg};
  border: 1px solid ${({ theme }) => theme.colors.accentBorder};
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.accentBorder};
  }
`

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const isServiceDown =
    error.message.toLowerCase().includes('fetch') ||
    error.message.toLowerCase().includes('connect') ||
    error.name === 'ApiError'

  return (
    <Wrapper>
      <Title>{isServiceDown ? 'Service unavailable' : 'Something went wrong'}</Title>
      <Message>
        {isServiceDown
          ? 'The API could not be reached. Make sure the server is running and try again.'
          : error.message || 'An unexpected error occurred.'}
      </Message>
      <RetryButton onClick={reset}>Try again</RetryButton>
    </Wrapper>
  )
}

'use client'

import styled from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  text-align: center;
`

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`

const Message = styled.p`
  color: var(--color-text-muted);
`

const RetryButton = styled.button`
  margin-top: 1.5rem;
  padding: 0.5rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 0.875rem;

  &:hover {
    background: var(--color-surface-hover);
  }
`

export default function StatsError({ reset }: { reset: () => void }) {
  return (
    <Wrapper>
      <Title>Stats temporarily unavailable</Title>
      <Message>Something went wrong loading these stats. Please try again.</Message>
      <RetryButton onClick={reset}>Try again</RetryButton>
    </Wrapper>
  )
}

import { ShortenForm } from '@/components/ShortenForm'
import styled from 'styled-components'

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`

const Description = styled.p`
  color: #6b7280;
  margin-bottom: 2rem;
  font-size: 0.95rem;
`

export default function Page() {
  return (
    <div>
      <Title>Shorten a URL</Title>
      <Description>
        Paste a long URL and get a short link instantly. Optionally add a custom slug or expiry
        date.
      </Description>
      <ShortenForm />
    </div>
  )
}

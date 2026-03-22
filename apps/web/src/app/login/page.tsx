'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import styled from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
`

const Card = styled.div`
  width: 100%;
  max-width: 360px;
  padding: 2rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};
`

const Title = styled.h1`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 0.375rem;
`

const Input = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
  }
`

const Button = styled.button`
  margin-top: 1.25rem;
  width: 100%;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  background: ${({ theme }) => theme.colors.accent};
  border: none;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const ErrorMsg = styled.p`
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.errorText};
`

function LoginForm() {
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      const from = searchParams.get('from') ?? '/urls'
      window.location.href = from
    } else {
      setError('Incorrect password')
      setLoading(false)
    }
  }

  return (
    <Wrapper>
      <Card>
        <Title>Sign in to snip</Title>
        <form onSubmit={handleSubmit}>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <Button type="submit" disabled={loading || !password}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </Wrapper>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

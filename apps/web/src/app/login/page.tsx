'use client'

import { useState } from 'react'
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
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
`

const Title = styled.h1`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #111827;
`

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.375rem;
`

const Input = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #2563eb;
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
  background: #2563eb;
  border: none;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: #1d4ed8;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const ErrorMsg = styled.p`
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: #dc2626;
`

export default function LoginPage() {
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

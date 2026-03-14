'use client'

import { useState } from 'react'
import styled from 'styled-components'
import { api, ApiError } from '@/lib/api'
import type { CreateUrlResponse } from '@snip/types'

// ---- Styled components ----

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`

const Hint = styled.span`
  color: #9ca3af;
  font-weight: 400;
`

const Input = styled.input`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`

const SubmitButton = styled.button`
  width: 100%;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const ErrorBox = styled.div`
  margin-top: 1rem;
  border: 1px solid #fca5a5;
  background: #fef2f2;
  border-radius: 0.375rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #b91c1c;
`

const ResultBox = styled.div`
  margin-top: 1.5rem;
  border: 1px solid #a7f3d0;
  background: #ecfdf5;
  border-radius: 0.5rem;
  padding: 1rem;
`

const ResultTitle = styled.p`
  font-size: 0.875rem;
  font-weight: 500;
  color: #065f46;
  margin-bottom: 0.5rem;
`

const ResultRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const ShortLink = styled.a`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
  font-size: 0.875rem;
  color: #2563eb;
  text-decoration: underline;
`

const CopyButton = styled.button`
  flex-shrink: 0;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 0.25rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.1s;

  &:hover {
    background: #f9fafb;
  }
`

const StatsLink = styled.a`
  display: block;
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: #2563eb;

  &:hover {
    text-decoration: underline;
  }
`

// ---- Component ----

export function ShortenForm() {
  const [originalUrl, setOriginalUrl] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [result, setResult] = useState<CreateUrlResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)

    try {
      const res = await api.createUrl({
        originalUrl,
        customSlug: customSlug || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      })
      setResult(res)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Unexpected error. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!result) return
    await navigator.clipboard.writeText(result.shortUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <Form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="url">URL to shorten</Label>
          <Input
            id="url"
            type="url"
            required
            placeholder="https://example.com/very/long/url"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
          />
        </Field>

        <TwoCol>
          <Field>
            <Label htmlFor="slug">
              Custom slug <Hint>(optional)</Hint>
            </Label>
            <Input
              id="slug"
              type="text"
              placeholder="my-link"
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value)}
            />
          </Field>

          <Field>
            <Label htmlFor="expires">
              Expires at <Hint>(optional)</Hint>
            </Label>
            <Input
              id="expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </Field>
        </TwoCol>

        <SubmitButton type="submit" disabled={loading}>
          {loading ? 'Shortening…' : 'Shorten URL'}
        </SubmitButton>
      </Form>

      {error && <ErrorBox>{error}</ErrorBox>}

      {result && (
        <ResultBox>
          <ResultTitle>Your short URL is ready!</ResultTitle>
          <ResultRow>
            <ShortLink href={result.shortUrl} target="_blank" rel="noopener noreferrer">
              {result.shortUrl}
            </ShortLink>
            <CopyButton onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</CopyButton>
          </ResultRow>
          <StatsLink href={`/stats/${result.slug}`}>View stats →</StatsLink>
        </ResultBox>
      )}
    </div>
  )
}

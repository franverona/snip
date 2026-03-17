'use client'

import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { api, ApiError } from '@/lib/api'
import { CreateUrlInputSchema, type CreateUrlResponse } from '@snip/types'
import { Button } from './ui'
import { useToast } from './Toast'

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

const SubmitButton = styled(Button)`
  width: 100%;
`

const FieldErrorMessage = styled.p`
  font-size: 0.75rem;
  color: #b91c1c;
  margin: 0;
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

const ResultActions = styled.div`
  display: flex;
  flex-direction: column;
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

const ActionButton = styled.button`
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

function FieldErrors({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null

  return (
    <>
      {errors.map((msg) => (
        <FieldErrorMessage key={msg}>{msg}</FieldErrorMessage>
      ))}
    </>
  )
}

export function ShortenForm() {
  const { showToast } = useToast()

  const [originalUrl, setOriginalUrl] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [result, setResult] = useState<CreateUrlResponse | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    setCanShare(!!navigator.share)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldErrors({})
    setApiError(null)
    setResult(null)
    setLoading(true)

    const body = {
      originalUrl,
      customSlug: customSlug || undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    }

    const validated = CreateUrlInputSchema.safeParse(body)
    if (!validated.success) {
      const errors: Record<string, string[]> = {}
      for (const issue of validated.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string') {
          errors[field] = [...(errors[field] ?? []), issue.message]
        }
      }
      setFieldErrors(errors)
      setLoading(false)
      return
    }

    try {
      const res = await api.createUrl(validated.data)
      setResult(res)
      showToast('URL created', 'success')
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message)
        showToast(err.message, 'error')
      } else {
        setApiError('Unexpected error. Please try again.')
        showToast('Unexpected error. Please try again.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.shortUrl)
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = result.shortUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleShare() {
    if (!result) return

    if (navigator.share) {
      await navigator.share({ url: result.shortUrl }).catch(() => {})
    }
  }

  return (
    <div>
      <Form onSubmit={handleSubmit} noValidate>
        <Field>
          <Label htmlFor="url">URL to shorten</Label>
          <Input
            id="url"
            type="url"
            placeholder="https://example.com/very/long/url"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
          />
          <FieldErrors errors={fieldErrors.originalUrl} />
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
              maxLength={50}
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value)}
            />
            <FieldErrors errors={fieldErrors.customSlug} />
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
            <FieldErrors errors={fieldErrors.expiresAt} />
          </Field>
        </TwoCol>

        <SubmitButton color="primary" type="submit" disabled={loading}>
          {loading ? 'Shortening…' : 'Shorten URL'}
        </SubmitButton>
      </Form>

      {apiError && <ErrorBox>{apiError}</ErrorBox>}

      {result && (
        <ResultBox>
          <ResultTitle>Your short URL is ready!</ResultTitle>
          <ResultRow>
            <ShortLink href={result.shortUrl} target="_blank" rel="noopener noreferrer">
              {result.shortUrl}
            </ShortLink>
            <ResultActions>
              <ActionButton onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</ActionButton>
              {canShare && <ActionButton onClick={handleShare}>Share</ActionButton>}
            </ResultActions>
          </ResultRow>
          <StatsLink href={`/stats/${result.slug}`}>View stats →</StatsLink>
        </ResultBox>
      )}
    </div>
  )
}

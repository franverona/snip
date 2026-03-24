'use client'

import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { api, ApiError } from '@/lib/api'
import { CreateUrlInputSchema, type CreateUrlResponse } from '@snip/types'
import { Button } from './ui'
import { useToast } from './Toast'
import { QRCodeSVG } from 'qrcode.react'
import { QRDownloadButton } from './QRDownloadButton'

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
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Hint = styled.span`
  color: ${({ theme }) => theme.colors.textHint};
  font-weight: 400;
`

const Input = styled.input`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
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

const AdvancedToggle = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.accent};
  cursor: pointer;
  text-align: left;
  width: fit-content;

  &:hover {
    text-decoration: underline;
  }
`

const AdvancedSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Textarea = styled.textarea`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  resize: vertical;
  font-family: inherit;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`

const SubmitButton = styled(Button)`
  width: 100%;
`

const FieldErrorMessage = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.errorText};
  margin: 0;
`

const ErrorBox = styled.div`
  margin-top: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.errorBorder};
  background: ${({ theme }) => theme.colors.errorBg};
  border-radius: 0.375rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.errorText};
`

const ResultBox = styled.div`
  margin-top: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.successBorder};
  background: ${({ theme }) => theme.colors.successBg};
  border-radius: 0.5rem;
  padding: 1rem;
`

const ResultTitle = styled.p`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.successText};
  margin-bottom: 1rem;
`

const ResultRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;

  @media (min-width: 480px) {
    gap: 0.5rem;
    flex-direction: row;
    align-items: center;
    margin-top: 0;
  }
`

const ResultRowLinks = styled.div`
  flex: 1;
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
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: underline;
`

const ActionButton = styled.button`
  flex-shrink: 0;
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  border-radius: 0.25rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.1s;
  width: 100%;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }
`

const ActionQRButton = styled(QRDownloadButton)`
  flex-shrink: 0;
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  border-radius: 0.25rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.1s;
  width: 100%;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }
`

const StatsLink = styled.a`
  display: block;
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.accent};

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
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
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
      title: title || undefined,
      description: description || undefined,
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

        <AdvancedToggle type="button" onClick={() => setShowAdvanced((v) => !v)}>
          {showAdvanced ? '▾ Hide advanced options' : '▸ Advanced options'}
        </AdvancedToggle>

        {showAdvanced && (
          <AdvancedSection>
            <Field>
              <Label htmlFor="title">
                Title <Hint>(optional — overrides scraped title)</Hint>
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="My awesome link"
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <FieldErrors errors={fieldErrors.title} />
            </Field>

            <Field>
              <Label htmlFor="description">
                Description <Hint>(optional — overrides scraped description)</Hint>
              </Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="A brief description of the destination page"
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <FieldErrors errors={fieldErrors.description} />
            </Field>
          </AdvancedSection>
        )}

        <SubmitButton color="primary" type="submit" disabled={loading}>
          {loading ? 'Shortening…' : 'Shorten URL'}
        </SubmitButton>
      </Form>

      {apiError && <ErrorBox>{apiError}</ErrorBox>}

      {result && (
        <ResultBox>
          <ResultTitle>Your short URL is ready!</ResultTitle>
          <QRCodeSVG
            height={100}
            width={100}
            title={result.shortUrl}
            value={result.shortUrl}
            style={{ background: '#fff', padding: '0.375rem', borderRadius: 4 }}
          />
          <ResultRow>
            <ResultRowLinks>
              <ShortLink href={result.shortUrl} target="_blank" rel="noopener noreferrer">
                {result.shortUrl}
              </ShortLink>
              <StatsLink href={`/stats/${result.slug}`}>View stats →</StatsLink>
            </ResultRowLinks>
            <ResultActions>
              <ActionButton onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</ActionButton>
              <ActionQRButton value={result.shortUrl} slug={result.slug} title={title}>
                Download QR
              </ActionQRButton>
              {canShare && <ActionButton onClick={handleShare}>Share</ActionButton>}
            </ResultActions>
          </ResultRow>
        </ResultBox>
      )}
    </div>
  )
}

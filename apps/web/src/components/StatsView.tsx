'use client'

import { useState } from 'react'
import styled from 'styled-components'
import type { UrlStats } from '@snip/types'
import { Button, useConfirmDialog } from './ui'
import { api, ApiError } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useToast } from './Toast'
import { QRCodeSVG } from 'qrcode.react'
import { QRDownloadButton } from './QRDownloadButton'

// ---- Styled components ----

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin-bottom: 0.5rem;
`

const PageTitle = styled.h1`
  flex: 1;
  font-size: 1.5rem;
  font-weight: 700;

  span {
    font-family: monospace;
    color: ${({ theme }) => theme.colors.accent};
  }
`

const SubText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 2rem;
`

const Card = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  margin-bottom: 1.5rem;
`

const CardLabel = styled.p`
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textHint};
  margin-bottom: 0.25rem;
`

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (min-width: 480px) {
    grid-template-columns: 136px 1fr;
  }
`

const DetailsCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`

const QRCode = styled(QRCodeSVG)`
  display: block;
  width: 100%;
  height: auto;
  margin: 1rem 0;
  padding: 0.5rem;
  background: #fff;
  border-radius: 4px;

  @media (min-width: 480px) {
    margin: 0.25rem 0;
  }
`

const DownloadButton = styled(QRDownloadButton)`
  margin-top: 0.5rem;
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  border-radius: 0.25rem;
  padding: 0.25rem 0;
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.1s;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }
`

const OriginalLink = styled.a`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: underline;
  word-break: break-all;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

const StatCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`

const StatValue = styled.p`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.accent};
`

const StatLabel = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 0.25rem;
`

const BarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  margin-bottom: 0.625rem;
`

const BarLabel = styled.span`
  width: 6rem;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.textMuted};
`

const BarTrack = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.barTrack};
  border-radius: 9999px;
  height: 0.75rem;
  overflow: hidden;
`

const BarFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${(p) => p.$pct}%;
  background: ${({ theme }) => theme.colors.barFill};
  border-radius: 9999px;
  transition: width 0.4s ease;
`

const BarCount = styled.span`
  width: 2.5rem;
  text-align: right;
  font-family: monospace;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ClickRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: 0.25rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  &:last-child {
    border-bottom: none;
  }
`

const BackLink = styled.a`
  display: block;
  text-align: center;
  margin-top: 2rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.accent};

  &:hover {
    text-decoration: underline;
  }
`

const ExpiredBanner = styled.div`
  background-color: ${({ theme }) => theme.colors.warningBg};
  border: 1px solid ${({ theme }) => theme.colors.warningBorder};
  border-radius: 6px;
  color: ${({ theme }) => theme.colors.warningText};
  padding: 0.625rem 0.875rem;
  font-size: 0.8125rem;
  margin-bottom: 0.75rem;
`

const EditField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1rem;

  &:last-of-type {
    margin-bottom: 0;
  }
`

const EditLabel = styled.label`
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const EditInput = styled.input`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const EditTextarea = styled.textarea`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: inherit;
  resize: vertical;
`

const EditActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1.25rem;
`

const CancelEditButton = styled.button`
  background: ${({ theme }) => theme.colors.surfaceHover};
  color: ${({ theme }) => theme.colors.textPrimary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.375rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
`

// ---- Component ----

// datetime-local inputs want "YYYY-MM-DDTHH:mm" in local time, no timezone suffix —
// shift by the local offset so the displayed wall-clock time round-trips correctly
// through `new Date(value).toISOString()` (which parses the un-suffixed string as local).
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

interface Props {
  stats: UrlStats
  slug: string
}

export function StatsView({ stats, slug }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const { openConfirmDialog, confirmDialog } = useConfirmDialog()
  const { url, totalClicks, clicksLast24h, clicksLast7d } = stats
  const maxClicks = Math.max(totalClicks, 1)

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(url.title ?? '')
  const [editDescription, setEditDescription] = useState(url.description ?? '')
  const [editExpiresAt, setEditExpiresAt] = useState(toDatetimeLocal(url.expiresAt))
  const [saving, setSaving] = useState(false)

  function pct(v: number) {
    return Math.round((v / maxClicks) * 100)
  }

  const handleDelete = () => {
    openConfirmDialog({
      title: `Delete /${slug}?`,
      message: 'After removing this URL, it will no longer be available.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await api.deleteUrl(slug)
          showToast('URL removed', 'success')
          router.replace('/')
        } catch (err) {
          console.error(err)
          showToast('An error ocurred when deleting the URL.', 'error')
        }
      },
    })
  }

  function startEditing() {
    setEditTitle(url.title ?? '')
    setEditDescription(url.description ?? '')
    setEditExpiresAt(toDatetimeLocal(url.expiresAt))
    setIsEditing(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.updateUrl(slug, {
        title: editTitle || null,
        description: editDescription || null,
        expiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
      })
      showToast('URL updated', 'success')
      setIsEditing(false)
      router.refresh()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update the URL.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const isExpired = url.expiresAt ? new Date(url.expiresAt) < new Date() : false
  const expiresAtFormatted = url.expiresAt
    ? new Date(url.expiresAt).toLocaleDateString('en-US', { dateStyle: 'long' })
    : ''

  return (
    <div>
      {confirmDialog}
      <PageHeader>
        <PageTitle>
          Stats for <span>/{slug}</span>
        </PageTitle>
        <Button type="button" onClick={startEditing}>
          Edit
        </Button>
        <Button color="error" onClick={handleDelete}>
          Delete
        </Button>
      </PageHeader>
      <SubText>
        Created{' '}
        {new Date(url.createdAt).toLocaleDateString('en-US', {
          dateStyle: 'long',
        })}
        {url.expiresAt && !isExpired && <>· Expires on {expiresAtFormatted}</>}
      </SubText>

      {isExpired && (
        <ExpiredBanner>
          This URL expired on {expiresAtFormatted} and now returns 410 Gone.
        </ExpiredBanner>
      )}

      {isEditing && (
        <Card as="form" onSubmit={handleSave}>
          <CardLabel style={{ marginBottom: '0.75rem' }}>Edit URL</CardLabel>
          <EditField>
            <EditLabel htmlFor="edit-title">Title</EditLabel>
            <EditInput
              id="edit-title"
              type="text"
              maxLength={200}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </EditField>
          <EditField>
            <EditLabel htmlFor="edit-description">Description</EditLabel>
            <EditTextarea
              id="edit-description"
              rows={3}
              maxLength={500}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </EditField>
          <EditField>
            <EditLabel htmlFor="edit-expires">Expires at</EditLabel>
            <EditInput
              id="edit-expires"
              type="datetime-local"
              value={editExpiresAt}
              onChange={(e) => setEditExpiresAt(e.target.value)}
            />
          </EditField>
          <EditActions>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <CancelEditButton type="button" onClick={() => setIsEditing(false)}>
              Cancel
            </CancelEditButton>
          </EditActions>
        </Card>
      )}

      <DetailsGrid>
        <DetailsCard>
          <CardLabel>QR Code</CardLabel>
          <QRCode title={url.shortUrl} value={url.shortUrl} />
          <DownloadButton value={url.shortUrl} slug={slug} title={url.title}>
            Download PNG
          </DownloadButton>
        </DetailsCard>
        <DetailsCard>
          <CardLabel>Original URL</CardLabel>
          <OriginalLink href={url.originalUrl} target="_blank" rel="noopener noreferrer">
            {url.originalUrl}
          </OriginalLink>
        </DetailsCard>
      </DetailsGrid>

      <StatsGrid>
        <StatCard>
          <StatValue data-testid="total-clicks">{totalClicks.toLocaleString('en-US')}</StatValue>
          <StatLabel>Total clicks</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{clicksLast24h.toLocaleString('en-US')}</StatValue>
          <StatLabel>Last 24 hours</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{clicksLast7d.toLocaleString('en-US')}</StatValue>
          <StatLabel>Last 7 days</StatLabel>
        </StatCard>
      </StatsGrid>

      <Card>
        <CardLabel style={{ marginBottom: '0.75rem' }}>Click breakdown</CardLabel>
        <BarRow>
          <BarLabel>Last 24h</BarLabel>
          <BarTrack>
            <BarFill $pct={pct(clicksLast24h)} />
          </BarTrack>
          <BarCount>{clicksLast24h}</BarCount>
        </BarRow>
        <BarRow>
          <BarLabel>Last 7 days</BarLabel>
          <BarTrack>
            <BarFill $pct={pct(clicksLast7d)} />
          </BarTrack>
          <BarCount>{clicksLast7d}</BarCount>
        </BarRow>
        <BarRow>
          <BarLabel>All time</BarLabel>
          <BarTrack>
            <BarFill $pct={100} />
          </BarTrack>
          <BarCount>{totalClicks}</BarCount>
        </BarRow>
      </Card>

      {stats.referrers.length > 0 && (
        <Card>
          <CardLabel style={{ marginBottom: '0.75rem' }}>Traffic sources</CardLabel>
          {stats.referrers.map((r) => (
            <BarRow key={r.domain}>
              <BarLabel title={r.domain}>{r.domain}</BarLabel>
              <BarTrack>
                <BarFill
                  $pct={Math.round((r.count / Math.max(stats.referrers[0]!.count, 1)) * 100)}
                />
              </BarTrack>
              <BarCount>{r.count}</BarCount>
            </BarRow>
          ))}
        </Card>
      )}

      {stats.recentClicks.length > 0 && (
        <Card>
          <CardLabel style={{ marginBottom: '0.75rem' }}>Recent clicks</CardLabel>
          {stats.recentClicks.map((click) => (
            <ClickRow key={click.id}>
              <span>{new Date(click.clickedAt).toLocaleString('en-US')}</span>
              {click.referer && (
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginLeft: '1rem',
                  }}
                >
                  from {click.referer}
                </span>
              )}
            </ClickRow>
          ))}
        </Card>
      )}

      <BackLink href="/urls">← Back to list</BackLink>
    </div>
  )
}

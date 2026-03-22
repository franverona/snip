'use client'

import { useState } from 'react'
import { type UrlListRecord } from '@snip/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styled from 'styled-components'
import { useToast } from '../Toast'
import { useConfirmDialog } from '../ui'
import { api } from '@/lib/api'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1.5rem;
`

const Card = styled.div<{ $selected?: boolean }>`
  border-radius: 6px;
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid
    ${({ theme, $selected }) => ($selected ? theme.colors.accentBorder : theme.colors.border)};
  border-left: 3px solid
    ${({ theme, $selected }) => ($selected ? theme.colors.accent : theme.colors.accent)};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: ${({ theme }) => theme.colors.accentBorder};
    border-left-color: ${({ theme }) => theme.colors.accent};
  }
`

const CardRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem 0.875rem;
`

const Checkbox = styled.input`
  margin-top: 0.2rem;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: ${({ theme }) => theme.colors.accent};
`

const ExpiredBadge = styled.span`
  font-size: 0.65rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.warningText};
  background: ${({ theme }) => theme.colors.warningBg};
  border: 1px solid ${({ theme }) => theme.colors.warningBorder};
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  flex-shrink: 0;
`

const CardUrls = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
`

const ShortLink = styled.a`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: 600;
  font-size: 0.8125rem;
  text-decoration: none;
  white-space: nowrap;
  min-width: 0;
  overflow: hidden;

  svg {
    color: ${({ theme }) => theme.colors.textHint};
    flex-shrink: 0;
    transition: color 0.1s ease;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
    svg {
      color: ${({ theme }) => theme.colors.accent};
    }
  }
`

const ShortLinkText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const DestinationLink = styled.a`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: none;
  word-break: break-all;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
    text-decoration: underline;
  }
`

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`

const DateLabel = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textHint};
  white-space: nowrap;

  @media (max-width: 480px) {
    display: none;
  }
`

const ViewStatsLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: 0.2rem 0.5rem;
  border-radius: 5px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceHover};
  text-decoration: none;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
    border-color: ${({ theme }) => theme.colors.accentBorder};
    background: ${({ theme }) => theme.colors.accentBg};
  }
`

const DeleteButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem 0.4rem;
  border-radius: 5px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceHover};
  color: ${({ theme }) => theme.colors.textHint};
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.errorText};
    border-color: ${({ theme }) => theme.colors.errorBorder};
    background: ${({ theme }) => theme.colors.errorBg};
  }
`

const BulkBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.875rem;
  background: ${({ theme }) => theme.colors.accentBg};
  border: 1px solid ${({ theme }) => theme.colors.accentBorder};
  border-radius: 6px;
  margin-bottom: 0.375rem;
`

const BulkBarLabel = styled.span`
  flex: 1;
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accent};
`

const BulkDeleteButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.25rem 0.625rem;
  border-radius: 5px;
  border: 1px solid ${({ theme }) => theme.colors.errorBorder};
  background: ${({ theme }) => theme.colors.errorBg};
  color: ${({ theme }) => theme.colors.errorText};
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.errorBorder};
  }
`

const ClearSelectionButton = styled.button`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

function UrlCard({
  url,
  isSelected,
  onToggleSelect,
}: {
  url: UrlListRecord
  isSelected: boolean
  onToggleSelect: (slug: string) => void
}) {
  const isExpired = url.expiresAt ? new Date(url.expiresAt) < new Date() : false
  const expiresAtFormatted = url.expiresAt
    ? new Date(url.expiresAt).toLocaleDateString('en-US', { dateStyle: 'long' })
    : ''
  const router = useRouter()
  const { showToast } = useToast()
  const { openConfirmDialog, confirmDialog } = useConfirmDialog()

  const handleDelete = () => {
    openConfirmDialog({
      title: `Delete /${url.slug}?`,
      message: 'After removing this URL, it will no longer be available.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await api.deleteUrl(url.slug)
          showToast('URL removed', 'success')
          router.refresh()
        } catch (err) {
          console.error(err)
          showToast('An error occurred when deleting the URL.', 'error')
        }
      },
    })
  }

  return (
    <>
      <Card $selected={isSelected}>
        <CardRow>
          <Checkbox
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(url.slug)}
            aria-label={`Select /${url.slug}`}
          />
          <CardUrls>
            {isExpired && (
              <ExpiredBadge title={`Expired ${expiresAtFormatted}`}>expired</ExpiredBadge>
            )}
            <ShortLink
              href={url.shortUrl}
              title={url.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${url.shortUrl}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
              <ShortLinkText>{url.shortUrl}</ShortLinkText>
            </ShortLink>
            <DestinationLink
              href={url.originalUrl}
              title={url.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${url.originalUrl}`}
            >
              {url.originalUrl}
            </DestinationLink>
          </CardUrls>

          <CardMeta>
            <DateLabel>
              {url.expiresAt && !isExpired && <>Expires {expiresAtFormatted} · </>}
              {new Date(url.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
            </DateLabel>
            <ViewStatsLink href={`/stats/${url.slug}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              Stats
            </ViewStatsLink>
            <DeleteButton onClick={handleDelete} aria-label={`Delete /${url.slug}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </DeleteButton>
          </CardMeta>
        </CardRow>
      </Card>
      {confirmDialog}
    </>
  )
}

export function Table({ data }: { data: UrlListRecord[] }) {
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set())
  const router = useRouter()
  const { showToast } = useToast()
  const { openConfirmDialog, closeConfirmDialog, confirmDialog } = useConfirmDialog()

  const toggleSelect = (slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const allSelected = data.length > 0 && selectedSlugs.size === data.length
  const someSelected = selectedSlugs.size > 0

  const toggleAll = () => {
    if (allSelected) {
      setSelectedSlugs(new Set())
    } else {
      setSelectedSlugs(new Set(data.map((u) => u.slug)))
    }
  }

  const handleBulkDelete = () => {
    const count = selectedSlugs.size
    openConfirmDialog({
      title: `Delete ${count} URL${count === 1 ? '' : 's'}?`,
      message: `This will permanently remove ${count} selected URL${count === 1 ? '' : 's'}. This action cannot be undone.`,
      confirmLabel: `Delete ${count}`,
      onConfirm: async () => {
        closeConfirmDialog()
        try {
          const result = await api.deleteUrls(Array.from(selectedSlugs))
          setSelectedSlugs(new Set())
          showToast(`${result.deleted} URL${result.deleted === 1 ? '' : 's'} deleted`, 'success')
          router.refresh()
        } catch (err) {
          console.error(err)
          showToast('An error occurred when deleting URLs.', 'error')
        }
      },
    })
  }

  return (
    <>
      {someSelected && (
        <BulkBar>
          <Checkbox
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            aria-label="Select all URLs"
          />
          <BulkBarLabel>{selectedSlugs.size} selected</BulkBarLabel>
          <ClearSelectionButton onClick={() => setSelectedSlugs(new Set())}>
            Clear
          </ClearSelectionButton>
          <BulkDeleteButton onClick={handleBulkDelete}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
            Delete {selectedSlugs.size}
          </BulkDeleteButton>
        </BulkBar>
      )}
      <Wrapper>
        {data.map((url) => (
          <UrlCard
            key={url.id}
            url={url}
            isSelected={selectedSlugs.has(url.slug)}
            onToggleSelect={toggleSelect}
          />
        ))}
      </Wrapper>
      {confirmDialog}
    </>
  )
}

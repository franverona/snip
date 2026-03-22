'use client'

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

const Card = styled.div`
  border-radius: 6px;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-left: 3px solid #2563eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: #bfdbfe;
    border-left-color: #2563eb;
  }
`

const CardRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem 0.875rem;
`

const ExpiredBadge = styled.span`
  font-size: 0.65rem;
  font-weight: 700;
  color: #b45309;
  background: #fff3e0;
  border: 1px solid #ed6c02;
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
  color: #111827;
  font-weight: 600;
  font-size: 0.8125rem;
  text-decoration: none;
  white-space: nowrap;
  min-width: 0;
  overflow: hidden;

  svg {
    color: #9ca3af;
    flex-shrink: 0;
    transition: color 0.1s ease;
  }

  &:hover {
    color: #2563eb;
    svg {
      color: #2563eb;
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
  color: #9ca3af;
  text-decoration: none;
  word-break: break-all;

  &:hover {
    color: #2563eb;
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
  color: #9ca3af;
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
  color: #6b7280;
  padding: 0.2rem 0.5rem;
  border-radius: 5px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  text-decoration: none;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover {
    color: #2563eb;
    border-color: #bfdbfe;
    background: #eff6ff;
  }
`

const DeleteButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem 0.4rem;
  border-radius: 5px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    color: #b91c1c;
    border-color: #fecaca;
    background: #fef2f2;
  }
`

function UrlCard({ url }: { url: UrlListRecord }) {
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
      <Card>
        <CardRow>
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
  return (
    <Wrapper>
      {data.map((url) => (
        <UrlCard key={url.id} url={url} />
      ))}
    </Wrapper>
  )
}

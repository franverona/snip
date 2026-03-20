'use client'

import { type UrlListRecord } from '@snip/types'
import Link from 'next/link'
import { QRCodeCanvas } from 'qrcode.react'
import styled from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`

const Card = styled.div`
  border-radius: 8px;
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

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;

  @media (min-width: 480px) {
    flex-direction: row;
    align-items: center;
  }
`

const SlugBadge = styled.div`
  display: inline-flex;
  align-self: flex-start;
  font-size: 0.75rem;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace;
  flex-shrink: 0;
`

const CustomBadge = styled.span`
  font-size: 0.65rem;
  font-weight: 700;
  color: #7c3aed;
  background: #f5f3ff;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  flex-shrink: 0;
`

const Dates = styled.div`
  font-size: 0.8rem;
  color: #9ca3af;
  white-space: nowrap;
  flex-shrink: 0;
`

const ExpiredBanner = styled.div`
  background-color: #fff3e0;
  border: 1px solid #ed6c02;
  border-radius: 6px;
  color: #b45309;
  padding: 0.625rem 0.875rem;
  font-size: 0.8125rem;
  margin: 1rem 1.25rem 1.25rem;
`

const CardDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 1.25rem;

  @media (min-width: 480px) {
    flex-direction: row;
    align-items: center;
  }
`

const QRCode = styled(QRCodeCanvas)`
  margin: 0 auto;
`

const CardUrls = styled.div`
  flex: 1;
  min-width: 0;
`

const ShortLink = styled.a`
  display: inline-flex;
  gap: 0.375rem;
  color: #111827;
  font-weight: 600;
  font-size: 0.9375rem;
  margin-bottom: 0.375rem;
  text-decoration: none;

  svg {
    color: #9ca3af;
    flex-shrink: 0;
    transition: color 0.1s ease;
    margin-top: 0.1rem;
  }

  &:hover {
    color: #2563eb;
    svg {
      color: #2563eb;
    }
  }
`

const Destination = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #9ca3af;
  overflow: hidden;

  a {
    color: #6b7280;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex: 1;
    text-decoration: none;

    &:hover {
      color: #2563eb;
      text-decoration: underline;
    }
  }
`

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.875rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
  padding: 1rem 1.25rem;
`

const CardActions = styled.div`
  flex: 1;
  text-align: right;
`

const ViewStatsLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
  padding: 0.25rem 0.625rem;
  border-radius: 5px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    color: #2563eb;
    border-color: #bfdbfe;
    background: #eff6ff;
  }
`

function UrlCard({ url }: { url: UrlListRecord }) {
  const isExpired = url.expiresAt ? new Date(url.expiresAt) < new Date() : false
  const expiresAtFormatted = url.expiresAt
    ? new Date(url.expiresAt).toLocaleDateString('en-US', { dateStyle: 'long' })
    : ''

  return (
    <Card>
      <CardHeader>
        <SlugBadge>/{url.slug}</SlugBadge>
        <Dates>
          {url.expiresAt && !isExpired && <>Expires {expiresAtFormatted} · </>}
          {new Date(url.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
        </Dates>
      </CardHeader>

      {isExpired && (
        <ExpiredBanner>Expired {expiresAtFormatted} — now returns 410 Gone.</ExpiredBanner>
      )}

      <CardDetails>
        <QRCode size={100} title={url.shortUrl} value={url.shortUrl} />
        <CardUrls>
          <ShortLink
            href={url.shortUrl}
            title={url.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${url.shortUrl}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
            {url.shortUrl}
          </ShortLink>

          <Destination>
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
              style={{ flexShrink: 0 }}
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
            <a
              href={url.originalUrl}
              title={url.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${url.originalUrl}`}
            >
              {url.originalUrl}
            </a>
          </Destination>
        </CardUrls>
      </CardDetails>

      <CardFooter>
        {url.customSlug && <CustomBadge>custom</CustomBadge>}
        <CardActions>
          <ViewStatsLink href={`/stats/${url.slug}`}>
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
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            View stats
          </ViewStatsLink>
        </CardActions>
      </CardFooter>
    </Card>
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

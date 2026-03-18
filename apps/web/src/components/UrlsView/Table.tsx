import { type UrlListRecord } from '@snip/types'
import styled from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
`

const Card = styled.div`
  border-radius: 4px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  padding: 1rem;
`

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`

const Id = styled.div`
  cursor: default;
  font-size: 0.75rem;
  color: #6b7688;
  background: #f9fafb;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
`

const Dates = styled.div`
  font-size: 0.825rem;
  color: #6b7688;
`

const ExpiredBanner = styled.div`
  background-color: #fff3e0;
  border: 1px solid #ed6c02;
  border-radius: 0.5rem;
  color: #b45309;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;
`

const ShortLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #2563eb;
  font-weight: 500;
  margin-bottom: 0.5rem;
`

const OriginalUrl = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
  a {
    color: #2563eb;
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
        <Id>{url.id}</Id>
        <Dates>
          {url.expiresAt && !isExpired && <>Expires on {expiresAtFormatted} · </>}
          Created{' '}
          {new Date(url.createdAt).toLocaleDateString('en-US', {
            dateStyle: 'long',
          })}
        </Dates>
      </CardHeader>
      {isExpired && (
        <ExpiredBanner>
          This URL expired on {expiresAtFormatted} and now returns 410 Gone.
        </ExpiredBanner>
      )}
      <ShortLink href={url.shortUrl} title={url.shortUrl} target="_blank" rel="noopener noreferrer">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
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
      <OriginalUrl>
        Redirects to{' '}
        <a href={url.originalUrl} title={url.originalUrl} target="_blank" rel="noopener noreferrer">
          {url.originalUrl}
        </a>
      </OriginalUrl>
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

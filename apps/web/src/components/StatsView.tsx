'use client'

import styled from 'styled-components'
import type { UrlStats } from '@snip/types'
import { Button } from './ui'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useToast } from './Toast'

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
    color: #2563eb;
  }
`

const SubText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 2rem;
`

const Card = styled.div`
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  margin-bottom: 1.5rem;
`

const CardLabel = styled.p`
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
  margin-bottom: 0.25rem;
`

const OriginalLink = styled.a`
  font-size: 0.875rem;
  color: #2563eb;
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
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`

const StatValue = styled.p`
  font-size: 2rem;
  font-weight: 700;
  color: #2563eb;
`

const StatLabel = styled.p`
  font-size: 0.8rem;
  color: #6b7280;
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
  color: #6b7280;
`

const BarTrack = styled.div`
  flex: 1;
  background: #f3f4f6;
  border-radius: 9999px;
  height: 0.75rem;
  overflow: hidden;
`

const BarFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${(p) => p.$pct}%;
  background: #3b82f6;
  border-radius: 9999px;
  transition: width 0.4s ease;
`

const BarCount = styled.span`
  width: 2.5rem;
  text-align: right;
  font-family: monospace;
  color: #374151;
`

const ClickRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
  padding: 0.25rem 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`

const BackLink = styled.a`
  display: block;
  text-align: center;
  margin-top: 2rem;
  font-size: 0.875rem;
  color: #2563eb;

  &:hover {
    text-decoration: underline;
  }
`

const ExpiredBanner = styled.div`
  background-color: #fff3e0;
  border: 1px solid #ed6c02;
  border-radius: 0.5rem;
  color: #b45309;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
`

// ---- Component ----

interface Props {
  stats: UrlStats
  slug: string
}

export function StatsView({ stats, slug }: Props) {
  const router = useRouter()
  const { showToast } = useToast()

  const { url, totalClicks, clicksLast24h, clicksLast7d } = stats
  const maxClicks = Math.max(totalClicks, 1)

  function pct(v: number) {
    return Math.round((v / maxClicks) * 100)
  }

  const handleDelete = async () => {
    if (window.confirm('After removing this URL, it will no longer be available.')) {
      try {
        await api.deleteUrl(slug)
        showToast('URL removed', 'success')
        router.replace('/')
      } catch (err) {
        console.error(err)
        showToast('An error ocurred when deleting the URL.', 'error')
      }
    }
  }

  const isExpired = url.expiresAt ? new Date(url.expiresAt) < new Date() : false
  const expiresAtFormatted = url.expiresAt
    ? new Date(url.expiresAt).toLocaleDateString('en-US', { dateStyle: 'long' })
    : ''

  return (
    <div>
      <PageHeader>
        <PageTitle>
          Stats for <span>/{slug}</span>
        </PageTitle>
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

      <Card>
        <CardLabel>Original URL</CardLabel>
        <OriginalLink href={url.originalUrl} target="_blank" rel="noopener noreferrer">
          {url.originalUrl}
        </OriginalLink>
      </Card>

      <StatsGrid>
        <StatCard>
          <StatValue>{totalClicks.toLocaleString('en-US')}</StatValue>
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

      <BackLink href="/">← Shorten another URL</BackLink>
    </div>
  )
}

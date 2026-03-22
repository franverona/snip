'use client'

import { Skeleton } from '@/components/ui'
import styled from 'styled-components'

const PageHeader = styled(Skeleton)`
  margin-bottom: 1.5rem;
`

const Card = styled(Skeleton)`
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  margin-bottom: 1.5rem;
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

const StatCard = styled(Skeleton)`
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`

export default function StatsLoading() {
  return (
    <div>
      <PageHeader $height={30} />
      <Card $height={70} />

      <StatsGrid>
        <StatCard $height={90} />
        <StatCard $height={90} />
        <StatCard $height={90} />
      </StatsGrid>

      <Card $height={120} />
      <Card $height={320} />
    </div>
  )
}

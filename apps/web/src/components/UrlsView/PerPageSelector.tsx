'use client'

import { useRouter } from 'next/navigation'
import styled from 'styled-components'

const StyledPerPageSelector = styled.select`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export function PerPageSelector({ perPage, q }: { perPage: number; q?: string }) {
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams({ page: '1', perPage: e.target.value })
    if (q) params.set('q', q)
    router.push(`/urls?${params.toString()}`)
  }

  return (
    <StyledPerPageSelector value={perPage} onChange={handleChange}>
      <option value="10">10</option>
      <option value="25">25</option>
      <option value="50">50</option>
    </StyledPerPageSelector>
  )
}

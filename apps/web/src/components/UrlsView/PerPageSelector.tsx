'use client'

import { useRouter } from 'next/navigation'
import styled from 'styled-components'

const StyledPerPageSelector = styled.select`
  border-color: #e5e7eb;
  border-radius: 4px;
`

export function PerPageSelector({ perPage }: { perPage: number }) {
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(`/urls?page=1&perPage=${e.target.value}`)
  }

  return (
    <StyledPerPageSelector value={perPage} onChange={handleChange}>
      <option value="10">10</option>
      <option value="25">25</option>
      <option value="50">50</option>
    </StyledPerPageSelector>
  )
}

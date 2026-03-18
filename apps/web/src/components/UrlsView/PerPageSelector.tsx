'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import styled from 'styled-components'

const StyledPerPageSelector = styled.select`
  border-color: #e5e7eb;
  border-radius: 4px;
`

export function PerPageSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('perPage', e.target.value)
    params.set('page', '1')
    router.push(`/urls?${params.toString()}`)
  }

  return (
    <StyledPerPageSelector value={searchParams.get('perPage') ?? '25'} onChange={handleChange}>
      <option value="10">10</option>
      <option value="25">25</option>
      <option value="50">50</option>
    </StyledPerPageSelector>
  )
}

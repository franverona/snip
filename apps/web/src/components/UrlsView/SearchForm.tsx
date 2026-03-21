'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex: 1;
  min-width: 0;
`

const Input = styled.input`
  padding: 0.3rem 0.625rem;
  font-size: 0.8125rem;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  outline: none;
  width: 220px;

  @media (max-width: 480px) {
    width: 100%;
    flex: 1;
  }
  color: #111827;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    border-color: #93c5fd;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }
`

const ClearButton = styled.button`
  padding: 0.3rem 0.625rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  line-height: 1;
  transition: color 0.15s ease;

  &:hover {
    color: #111827;
  }
`

export function SearchForm({ q, perPage }: { q?: string; perPage: number }) {
  const router = useRouter()
  const [value, setValue] = useState(q ?? '')
  const perPageRef = useRef(perPage)
  const didMount = useRef(false)

  useEffect(() => {
    perPageRef.current = perPage
  }, [perPage])

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ page: '1', perPage: String(perPageRef.current) })
      if (value) params.set('q', value)
      router.push(`/urls?${params.toString()}`)
    }, 400)
    return () => clearTimeout(timer)
  }, [value, router])

  function handleClear() {
    setValue('')
    router.push(`/urls?page=1&perPage=${perPageRef.current}`)
  }

  return (
    <Wrapper>
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search URLs…"
        aria-label="Search URLs"
      />
      {q && (
        <ClearButton type="button" onClick={handleClear}>
          Clear
        </ClearButton>
      )}
    </Wrapper>
  )
}

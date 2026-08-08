'use client'

import styled from 'styled-components'

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`

export const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const Hint = styled.span`
  color: ${({ theme }) => theme.colors.textHint};
  font-weight: 400;
`

export const Input = styled.input`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`

export const Textarea = styled.textarea`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  resize: vertical;
  font-family: inherit;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`

export const FieldErrorMessage = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.errorText};
  margin: 0;
`

export function FieldErrors({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null

  return (
    <>
      {errors.map((msg) => (
        <FieldErrorMessage key={msg}>{msg}</FieldErrorMessage>
      ))}
    </>
  )
}

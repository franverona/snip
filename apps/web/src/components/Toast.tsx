'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'

type ToastType = 'default' | 'success' | 'error'

type ColorShades = {
  border: string
  background: string
  text: string
}

const COLORS: Record<ToastType, ColorShades> = {
  default: {
    border: '#e5e7eb',
    background: '#fff',
    text: 'inherit',
  },
  success: {
    border: '#b9f8cf',
    background: '#dcfce7',
    text: '#0d542b',
  },
  error: {
    border: '#ffc9c9',
    background: '#ffe2e2',
    text: '#82181a',
  },
}

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const Wrapper = styled.div<{ $type: ToastType }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  position: fixed;
  bottom: 1.6rem;
  right: 1.6rem;
  z-index: 50;
  border-radius: 4px;
  border: ${({ $type }) => `1px solid ${COLORS[$type].border}`};
  background: ${({ $type }) => COLORS[$type].background};
  color: ${({ $type }) => COLORS[$type].text};
  padding: 0.8rem 1rem;
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.07),
    0 4px 6px -4px rgb(0 0 0 / 0.05);
  animation: ${slideUp} 0.2s ease-out;

  svg {
    stroke: ${({ $type }) => COLORS[$type].text};
  }
`

const Message = styled.div`
  cursor: default;
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
`

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: none;
  margin-left: 0.25rem;
`

type ToastContextValue = { showToast: (message: string, type?: ToastType) => void }
const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

function Icon({ type }: { type: ToastType }) {
  switch (type) {
    case 'success':
      return (
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
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )
    case 'error':
      return (
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
          <circle cx="12" cy="12" r="10" />
          <path d="M4.929 4.929 19.07 19.071" />
        </svg>
      )
    case 'default':
      return null
  }
}

function Toast({
  message,
  onClose,
  type = 'default',
}: {
  message: string
  onClose: () => void
  type?: ToastType
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <Wrapper $type={type}>
      <Icon type={type} />
      <Message>{message}</Message>
      <CloseButton onClick={onClose}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </CloseButton>
    </Wrapper>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{
    message: string
    type?: ToastType
    id: number
  } | null>(null)
  const showToast = useCallback(
    (message: string, type?: ToastType) =>
      setToast((prev) => ({ message, type: type || 'default', id: (prev?.id ?? 0) + 1 })),
    [],
  )
  const dismissToast = useCallback(() => setToast(null), [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast key={toast.id} message={toast.message} onClose={dismissToast} type={toast.type} />
      )}
    </ToastContext.Provider>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import styled from 'styled-components'
import { Button } from './Button'

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
`

const Dialog = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  border-radius: 0.5rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 24rem;
  box-shadow:
    0 20px 25px -5px rgb(0 0 0 / 0.1),
    0 8px 10px -6px rgb(0 0 0 / 0.1);
`

const DialogTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`

const DialogMessage = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 1.25rem;
`

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`

const CancelButton = styled.button`
  background: ${({ theme }) => theme.colors.cancelBg};
  color: ${({ theme }) => theme.colors.cancelText};
  border: none;
  border-radius: 0.375rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.cancelBgHover};
  }
`

type ConfirmDialogOptions = Omit<ConfirmDialogProps, 'onCancel'>

export function useConfirmDialog() {
  const [config, setConfig] = useState<ConfirmDialogOptions | null>(null)

  const openConfirmDialog = useCallback((options: ConfirmDialogOptions) => {
    setConfig(options)
  }, [])

  const closeConfirmDialog = useCallback(() => setConfig(null), [])

  const confirmDialog = config ? <ConfirmDialog {...config} onCancel={closeConfirmDialog} /> : null

  return { openConfirmDialog, closeConfirmDialog, confirmDialog }
}

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  actions?: ReactNode
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  actions,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  return (
    <Overlay onClick={onCancel}>
      <Dialog
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle id="confirm-title">{title}</DialogTitle>
        <DialogMessage id="confirm-desc">{message}</DialogMessage>
        <DialogActions>
          {actions ?? (
            <>
              <CancelButton ref={cancelRef} onClick={onCancel}>
                Cancel
              </CancelButton>
              <Button color="error" onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Overlay>
  )
}

// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'styled-components'
import { describe, expect, it, vi } from 'vitest'
import { theme } from '@/lib/theme'
import { ConfirmDialog } from './ConfirmDialog'

function renderDialog(overrides: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(
    <ThemeProvider theme={theme}>
      <ConfirmDialog
        title="Delete /abc123?"
        message="This cannot be undone."
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...overrides}
      />
    </ThemeProvider>,
  )
  return { onConfirm, onCancel }
}

describe('ConfirmDialog', () => {
  it('renders the title and message', () => {
    renderDialog()
    expect(screen.getByText('Delete /abc123?')).toBeInTheDocument()
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()
  })

  it('renders default Cancel/Confirm buttons and calls the right handler for each', async () => {
    const user = userEvent.setup()
    const { onConfirm, onCancel } = renderDialog()

    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('uses a custom confirmLabel when provided', () => {
    renderDialog({ confirmLabel: 'Delete 3' })
    expect(screen.getByRole('button', { name: 'Delete 3' })).toBeInTheDocument()
  })

  it('renders custom actions instead of the default buttons', () => {
    renderDialog({ actions: <button>Custom action</button> })
    expect(screen.getByRole('button', { name: 'Custom action' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
  })

  it('calls onCancel when clicking the overlay but not when clicking inside the dialog', async () => {
    const user = userEvent.setup()
    const { onCancel } = renderDialog()

    await user.click(screen.getByText('Delete /abc123?'))
    expect(onCancel).not.toHaveBeenCalled()

    await user.click(screen.getByRole('alertdialog').parentElement!)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when Escape is pressed', async () => {
    const user = userEvent.setup()
    const { onCancel } = renderDialog()

    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('focuses the cancel button on mount', () => {
    renderDialog()
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })
})

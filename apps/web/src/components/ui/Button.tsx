import { type ButtonHTMLAttributes } from 'react'
import styled from 'styled-components'

type ButtonColor = 'primary' | 'error'

type ColorShades = {
  text: string
  main: string
  hover: string
}

const COLORS: Record<ButtonColor, ColorShades> = {
  primary: {
    text: '#fff',
    main: '#2563eb',
    hover: '#1d4ed8',
  },
  error: {
    text: '#fff',
    main: '#b91c1c',
    hover: '#991b1b',
  },
}

const StyledButton = styled.button<{ $color: ButtonColor }>`
  background: ${({ $color }) => COLORS[$color].main};
  color: ${({ $color }) => COLORS[$color].text};
  border: none;
  border-radius: 0.375rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: ${({ $color }) => COLORS[$color].hover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: ButtonColor
}

export function Button(props: ButtonProps) {
  const { color = 'primary', ...rest } = props
  return (
    <StyledButton $color={color} {...rest}>
      {props.children}
    </StyledButton>
  )
}

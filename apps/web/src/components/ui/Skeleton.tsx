import styled, { keyframes } from 'styled-components'

type Dimension = number | '100%'

const wave = keyframes`
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(100%);
  }
`

export const Skeleton = styled.div<{ $width?: Dimension; $height?: Dimension }>`
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  background-color: #e5e7eb;
  width: ${({ $width }) => `${$width || '100%'}${typeof $width === 'number' ? 'px' : ''}`};
  height: ${({ $height }) => `${$height || '100%'}${typeof $height === 'number' ? 'px' : ''}`};

  &:after {
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
    content: '';
    position: absolute;
    transform: translateX(-100%);
    inset: 0px;
    animation: 2s linear 0.5s infinite normal none running ${wave};
  }
`

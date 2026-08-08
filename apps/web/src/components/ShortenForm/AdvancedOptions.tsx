'use client'

import { useState } from 'react'
import styled from 'styled-components'
import { Field, Label, Hint, Input, Textarea, FieldErrors } from './FormField'

const AdvancedToggle = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.accent};
  cursor: pointer;
  text-align: left;
  width: fit-content;

  &:hover {
    text-decoration: underline;
  }
`

const AdvancedSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

interface Props {
  title: string
  onTitleChange: (value: string) => void
  titleErrors?: string[]
  description: string
  onDescriptionChange: (value: string) => void
  descriptionErrors?: string[]
}

export function AdvancedOptions({
  title,
  onTitleChange,
  titleErrors,
  description,
  onDescriptionChange,
  descriptionErrors,
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <>
      <AdvancedToggle type="button" onClick={() => setShowAdvanced((v) => !v)}>
        {showAdvanced ? '▾ Hide advanced options' : '▸ Advanced options'}
      </AdvancedToggle>

      {showAdvanced && (
        <AdvancedSection>
          <Field>
            <Label htmlFor="title">
              Title <Hint>(optional — overrides scraped title)</Hint>
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="My awesome link"
              maxLength={200}
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
            <FieldErrors errors={titleErrors} />
          </Field>

          <Field>
            <Label htmlFor="description">
              Description <Hint>(optional — overrides scraped description)</Hint>
            </Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="A brief description of the destination page"
              maxLength={500}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
            />
            <FieldErrors errors={descriptionErrors} />
          </Field>
        </AdvancedSection>
      )}
    </>
  )
}

'use client'

import { Field, Label, Hint, Input, FieldErrors } from './FormField'

interface Props {
  value: string
  onChange: (value: string) => void
  errors?: string[]
}

export function CustomSlugField({ value, onChange, errors }: Props) {
  return (
    <Field>
      <Label htmlFor="slug">
        Custom slug <Hint>(optional)</Hint>
      </Label>
      <Input
        id="slug"
        type="text"
        placeholder="my-link"
        maxLength={50}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <FieldErrors errors={errors} />
    </Field>
  )
}

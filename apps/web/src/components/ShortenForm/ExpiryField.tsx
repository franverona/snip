'use client'

import { Field, Label, Hint, Input, FieldErrors } from './FormField'

interface Props {
  value: string
  onChange: (value: string) => void
  errors?: string[]
}

export function ExpiryField({ value, onChange, errors }: Props) {
  return (
    <Field>
      <Label htmlFor="expires">
        Expires at <Hint>(optional)</Hint>
      </Label>
      <Input
        id="expires"
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <FieldErrors errors={errors} />
    </Field>
  )
}

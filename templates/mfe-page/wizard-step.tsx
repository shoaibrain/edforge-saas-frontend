import { Field, InlineAlert, Input, Stack } from '@edforge/ui'

export interface __PAGE_COMPONENT__Props {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function __PAGE_COMPONENT__({ value, onChange, error }: __PAGE_COMPONENT__Props) {
  return (
    <Stack>
      <InlineAlert variant="info">
        Explain why this setup step matters before asking for data.
      </InlineAlert>

      <Field label="Step value" required optionalText={null} error={error}>
        <Input
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder="Enter a value"
        />
      </Field>
    </Stack>
  )
}

import { Button, PageHeader, PageShell, SectionCard, Stack } from '@edforge/ui'

export default function __PAGE_COMPONENT__() {
  return (
    <PageShell variant="settings">
      <Stack space="xl">
        <PageHeader
          title="__PAGE_TITLE__"
          description="Describe what admins configure on this page."
          actions={<Button>Add item</Button>}
        />

        <SectionCard
          title="Configuration"
          description="Group related settings in a shared section card."
        >
          {/* Compose with Field/Input/Select/Switch or @edforge/forms adapters. */}
        </SectionCard>
      </Stack>
    </PageShell>
  )
}

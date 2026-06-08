import {
  Button,
  EmptyState,
  PageHeader,
  PageShell,
  SectionCard,
  Stack,
} from '@edforge/ui'

export default function __PAGE_COMPONENT__() {
  return (
    <PageShell variant="dataTable">
      <Stack space="lg">
        <PageHeader
          title="__PAGE_TITLE__"
          description="Search, filter, and manage records."
          actions={<Button>Add record</Button>}
        />

        <SectionCard contentClassName="p-0">
          {/* Replace with DataTable when columns/data are wired. */}
          <EmptyState
            title="No records yet"
            description="Records will appear here after they are created."
            action={<Button>Add record</Button>}
          />
        </SectionCard>
      </Stack>
    </PageShell>
  )
}

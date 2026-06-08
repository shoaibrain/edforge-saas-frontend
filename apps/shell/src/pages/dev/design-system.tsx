import {
  Accordion,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Dropdown,
  FilterTabs,
  Heading,
  Inline,
  PageHeader,
  SectionCard,
  Stack,
  Tag,
  Text,
  type FilterTab,
} from '@edforge/ui'
import { useState } from 'react'

const surfaceTokens = [
  ['background.primary', 'var(--background-primary)'],
  ['background.secondary', 'var(--background-secondary)'],
  ['background.tertiary', 'var(--background-tertiary)'],
  ['background.elevated', 'var(--background-elevated)'],
]

const textTokens = [
  ['text.primary', 'var(--text-primary)'],
  ['text.secondary', 'var(--text-secondary)'],
  ['text.tertiary', 'var(--text-tertiary)'],
  ['text.onAccent', 'var(--text-on-accent)'],
]

const stateTokens = [
  ['success', 'var(--state-success-bg)', 'var(--state-success-fg)', 'var(--state-success-border)'],
  ['warning', 'var(--state-warning-bg)', 'var(--state-warning-fg)', 'var(--state-warning-border)'],
  ['danger', 'var(--state-danger-bg)', 'var(--state-danger-fg)', 'var(--state-danger-border)'],
  ['info', 'var(--state-info-bg)', 'var(--state-info-fg)', 'var(--state-info-border)'],
]

const tabs: FilterTab[] = [
  { key: 'all', label: 'All', count: 24 },
  { key: 'active', label: 'Active', count: 18 },
  { key: 'paused', label: 'Paused', count: 6 },
]

function TokenSwatch({
  label,
  value,
  kind = 'background',
}: {
  label: string
  value: string
  kind?: 'background' | 'text'
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-background-secondary p-3">
      <div
        className="mb-3 h-12 rounded-lg border border-border-subtle"
        style={{
          background: kind === 'background' ? `rgb(${value})` : 'rgb(var(--background-primary))',
          color: kind === 'text' ? `rgb(${value})` : 'rgb(var(--text-primary))',
        }}
      >
        {kind === 'text' ? <span className="grid h-full place-items-center text-sm font-medium">Aa</span> : null}
      </div>
      <Text variant="label">{label}</Text>
      <Text variant="caption" className="font-mono">
        {value}
      </Text>
    </div>
  )
}

export default function DesignSystemDevPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [dropdownValue, setDropdownValue] = useState<string | null>('compact')

  if (!import.meta.env.DEV) {
    return (
      <Container className="py-12">
        <SectionCard title="Design system preview unavailable">
          <Text>This route is only available in local development builds.</Text>
        </SectionCard>
      </Container>
    )
  }

  return (
    <Container size="wide" className="py-8">
      <Stack space="xl">
        <PageHeader
          title="Design System"
          description="Development-only showcase for semantic tokens, primitives, density, and focus states."
          actions={<Button variant="outline">DEV only</Button>}
        />

        <SectionCard title="Semantic color tokens" description="Theme-aware aliases used by app and UI components.">
          <Stack>
            <div className="grid gap-3 md:grid-cols-4">
              {surfaceTokens.map(([label, value]) => (
                <TokenSwatch key={label} label={label} value={value} />
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {textTokens.map(([label, value]) => (
                <TokenSwatch key={label} label={label} value={value} kind="text" />
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {stateTokens.map(([label, bg, fg, border]) => (
                <div
                  key={label}
                  className="rounded-xl border p-3"
                  style={{
                    background: `rgb(${bg})`,
                    color: `rgb(${fg})`,
                    borderColor: `rgb(${border})`,
                  }}
                >
                  <Text as="span" variant="label" className="text-current">
                    {label}
                  </Text>
                </div>
              ))}
            </div>
          </Stack>
        </SectionCard>

        <SectionCard title="Controls" description="Default, hover, active, focus, and disabled states.">
          <Stack>
            <Inline>
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button disabled>Disabled</Button>
            </Inline>
            <Inline>
              <FilterTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
              <Dropdown
                value={dropdownValue}
                onChange={setDropdownValue}
                options={[
                  { id: 'compact', label: 'Compact density' },
                  { id: 'comfortable', label: 'Comfortable density' },
                ]}
              />
            </Inline>
          </Stack>
        </SectionCard>

        <SectionCard title="Cards, tags, and typography">
          <div className="grid gap-4 md:grid-cols-2">
            <Card role="button" onClick={() => undefined}>
              <CardHeader>
                <Heading level={3} variant="section">
                  Interactive card
                </Heading>
              </CardHeader>
              <CardContent>
                <Stack space="sm">
                  <Text>
                    Use Tab, Enter, and Space to verify semantic focus and activation.
                  </Text>
                  <Inline gap="sm">
                    <Tag>Static tag</Tag>
                    <Tag role="button" onClick={() => undefined} variant="teal">
                      Clickable tag
                    </Tag>
                  </Inline>
                </Stack>
              </CardContent>
            </Card>

            <Accordion
              items={[
                {
                  id: 'states',
                  trigger: 'Component states',
                  panel: 'Default, hover, active, focus-visible, disabled, and loading are required for interactive primitives.',
                },
                {
                  id: 'motion',
                  trigger: 'Motion',
                  panel: 'Durations and easings use semantic motion tokens and should remain restrained.',
                },
              ]}
            />
          </div>
        </SectionCard>
      </Stack>
    </Container>
  )
}

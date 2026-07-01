import {
  Accordion,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Combobox,
  Container,
  Dropdown,
  EmptyState,
  ErrorState,
  FilterTabs,
  Field,
  Heading,
  Input,
  InlineAlert,
  Inline,
  LoadingState,
  PageHeader,
  PageShell,
  RadioGroup,
  SectionCard,
  Select,
  Stack,
  StatBand,
  AlertLane,
  type DashboardAlert,
  WidgetCard,
  WidgetGrid,
  Switch,
  DataTableMoreFilters,
  TableBulkBar,
  TablePresetTabs,
  Tag,
  Tabs,
  Text,
  Textarea,
  type FilterTab,
  type StatMetric,
  type TabItem,
} from '@edforge/ui'
import { useState } from 'react'
import { Archive, Upload, UserPlus } from 'lucide-react'

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

const pageTabs: TabItem[] = [
  { id: 'hierarchy', label: 'Hierarchy', count: 3 },
  { id: 'networks', label: 'Networks' },
  { id: 'details', label: 'Details' },
]

// Handoff surface ② — exercises every state + micro-viz + animated-icon variant.
const bandMetrics: StatMetric[] = [
  {
    label: 'Total Enrolled',
    value: '255',
    iconSignature: 'students',
    state: 'normal',
    primary: true,
    delta: { dir: 'up', val: '+6' },
    sub: 'across 13 grades',
    detail: '6 enrolled in the last 30 days',
  },
  {
    label: 'At-risk Students',
    value: '20',
    iconSignature: 'atrisk',
    state: 'critical',
    pill: { tone: 'critical', text: '20 critical' },
    sub: 'below 90% attendance',
  },
  {
    label: "Today's Attendance",
    value: '0%',
    iconSignature: 'metric_attendance',
    state: 'warn',
    meter: { pct: 0, target: 90 },
    sub: 'Partial data · 0 marked',
  },
  {
    label: 'Result Readiness',
    value: '50%',
    iconSignature: 'gpa',
    state: 'normal',
    donut: { pct: 50 },
    sub: '1 / 2 generated',
  },
  {
    label: 'Live Now',
    value: '1',
    iconSignature: 'overview',
    state: 'live',
    sub: 'in session',
  },
  {
    label: 'Grade Levels',
    value: '13',
    iconSignature: 'gradelevels',
    state: 'muted',
    sub: 'covered this year',
  },
]

const examBandMetrics: StatMetric[] = [
  { label: 'Total Exams', value: '10', iconSignature: 'exams', state: 'normal', primary: true, sub: '5 types · 4 terms' },
  { label: 'Live Now', value: '1', iconSignature: 'metric_attendance', state: 'live', sub: 'in session' },
  { label: 'Upcoming', value: '1', iconSignature: 'attendance', state: 'info', sub: 'Next: Second Term Exam' },
  { label: 'Awaiting Results', value: '1', iconSignature: 'atrisk', state: 'warn', pill: { tone: 'warn', text: 'Action needed' }, sub: 'result not generated' },
  { label: 'Result Readiness', value: '50%', iconSignature: 'gpa', state: 'normal', donut: { pct: 50 }, sub: '1 / 2 generated' },
]

const bandPresets = [
  { value: 'all', label: 'All', count: 255 },
  { value: 'active', label: 'Active', count: 235 },
  { value: 'atrisk', label: 'At-risk', count: 20 },
  { value: 'pending', label: 'Pending', count: 0 },
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
        // allow-presentation-style: token-gallery swatch renders the token's own raw rgb value
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
  const [pageTab, setPageTab] = useState('hierarchy')
  const [dropdownValue, setDropdownValue] = useState<string | null>('compact')
  const [selectValue, setSelectValue] = useState<string | null>('high')
  const [comboboxValue, setComboboxValue] = useState<string | null>(null)
  const [radioValue, setRadioValue] = useState('high')
  const [switchValue, setSwitchValue] = useState(true)
  const [bandPreset, setBandPreset] = useState('all')
  const [showBulk, setShowBulk] = useState(false)

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
    <PageShell as="div" variant="overview">
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
                  // allow-presentation-style: state-token gallery renders each token's raw rgb triplet
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
              <Button variant="tonal">Tonal</Button>
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

        <SectionCard title="Form primitives" description="Field, Input, and Textarea foundation states.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="School name" required helperText="Use the public-facing institution name.">
              <Input placeholder="Sunrise Academy" />
            </Field>
            <Field label="IEMIS code" lockedReason="Locked after school creation.">
              <Input defaultValue="31012345" readOnly className="font-mono" />
            </Field>
            <Field label="Short name" error="Short name must be 50 characters or fewer.">
              <Input defaultValue="A very long display name" />
            </Field>
            <Field label="School notes" helperText="Shown to administrators only.">
              <Textarea defaultValue="Calm, readable multi-line input." maxLength={120} showCharacterCount />
            </Field>
            <Select
              label="School type"
              value={selectValue}
              onChange={setSelectValue}
              options={[
                { value: 'elementary', label: 'Elementary' },
                { value: 'middle', label: 'Middle' },
                { value: 'high', label: 'High School', description: 'Grades 9–12' },
              ]}
            />
            <Combobox
              label="Parent district"
              value={comboboxValue}
              onChange={setComboboxValue}
              placeholder="Search districts"
              options={[
                { value: 'north', label: 'North District' },
                { value: 'south', label: 'South District' },
                { value: 'central', label: 'Central Learning Network' },
              ]}
            />
            <Field label="School type options" helperText="Card-style radio controls for high-confidence choices.">
              <RadioGroup
                variant="card"
                direction="horizontal"
                value={radioValue}
                onChange={setRadioValue}
                options={[
                  { value: 'elementary', label: 'Elementary' },
                  { value: 'high', label: 'High School' },
                ]}
              />
            </Field>
            <Field label="Operational settings">
              <Stack space="sm">
                <Checkbox label="Include inactive schools" description="Show archived schools in lists." />
                <Switch
                  checked={switchValue}
                  onChange={setSwitchValue}
                  label="Auto-sync calendars"
                  description="Keep term dates aligned with workspace defaults."
                />
              </Stack>
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Page recipes and states" description="Tabs, alerts, and non-data states for MFE pages.">
          <Stack>
            <Tabs tabs={pageTabs} value={pageTab} onChange={setPageTab} />
            <InlineAlert variant="info" title="Setup guidance">
              Settings pages should use shared recipes and primitives before page-local styling.
            </InlineAlert>
            <div className="grid gap-4 md:grid-cols-3">
              <EmptyState title="No schools yet" description="Add a school to start configuring academics." />
              <LoadingState label="Loading settings" />
              <ErrorState title="Could not load settings" description="Try again from the preview toolbar." />
            </div>
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

        <SectionCard
          title="Handoff surfaces"
          description="The three canonical, config-driven operator surfaces: PageHeader (pagebar), StatBand, and the unified table toolbar. See docs/design-system/handoff-token-map.md."
        >
          <Stack space="lg">
            {/* ① PageHeader — pagebar mode */}
            <div>
              <Text variant="label" className="mb-2 block">
                ① PageHeader · pagebar mode
              </Text>
              <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
                <PageHeader
                  mode="pagebar"
                  year="2083"
                  date="Tuesday, Jun 30"
                  onYearClick={() => undefined}
                  actions={[
                    { label: 'Import IEMIS', icon: <Upload className="h-3.5 w-3.5" /> },
                    { label: 'Enroll student', icon: <UserPlus className="h-3.5 w-3.5" />, primary: true },
                  ]}
                />
              </div>
            </div>

            {/* ② StatBand — every state + micro-viz */}
            <div>
              <Text variant="label" className="mb-2 block">
                ② StatBand · delta · pill · meter · donut · live · muted (calm by default)
              </Text>
              <StatBand metrics={bandMetrics} ariaLabel="Students key metrics" />
            </div>

            <div>
              <Text variant="label" className="mb-2 block">
                ② StatBand · five-segment Exams band
              </Text>
              <StatBand metrics={examBandMetrics} ariaLabel="Exams key metrics" />
            </div>

            {/* ③ Table toolbar pieces */}
            <div>
              <Text variant="label" className="mb-2 block">
                ③ Table toolbar · docked presets ↔ bulk bar (same footprint)
              </Text>
              <div className="rounded-xl border border-border-subtle bg-background-secondary p-3">
                {showBulk ? (
                  <TableBulkBar
                    count={3}
                    selectedRows={[{ id: 'a' }, { id: 'b' }, { id: 'c' }]}
                    onClear={() => setShowBulk(false)}
                    actions={[
                      { id: 'archive', label: 'Archive', tone: 'critical', icon: <Archive className="h-4 w-4" />, onRun: () => setShowBulk(false) },
                    ]}
                  />
                ) : (
                  <div className="flex min-h-9 flex-wrap items-center gap-3">
                    <TablePresetTabs presets={bandPresets} active={bandPreset} onChange={setBandPreset} />
                    <DataTableMoreFilters label="More filters" activeCount={0}>
                      <Select
                        aria-label="Status"
                        size="sm"
                        value={selectValue ?? ''}
                        onChange={setSelectValue}
                        options={[
                          { value: '', label: 'All status' },
                          { value: 'active', label: 'Active' },
                          { value: 'inactive', label: 'Inactive' },
                        ]}
                      />
                    </DataTableMoreFilters>
                    <Button variant="outline" size="sm" onClick={() => setShowBulk(true)}>
                      Simulate selection
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Stack>
        </SectionCard>

        <SectionCard
          title="Dashboard surfaces"
          description="The two new canonical recipes for Home + module Overview: ④ AlertLane (severity-ranked, ack/dismiss, session-only) and ⑤ WidgetCard grid, plus the PageHeader greeting mode. See docs/design-system/retrospective-s0-s2-academics.md."
        >
          <Stack space="lg">
            {/* PageHeader — greeting mode (Home) */}
            <div>
              <Text variant="label" className="mb-2 block">
                PageHeader · greeting mode (Home)
              </Text>
              <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
                <PageHeader
                  mode="greeting"
                  greeting="Good morning, Shoaib"
                  actions={[
                    { label: 'Enroll student', icon: <UserPlus className="h-3.5 w-3.5" /> },
                    { label: 'Record payment', icon: <Upload className="h-3.5 w-3.5" />, primary: true },
                  ]}
                />
              </div>
            </div>

            {/* ④ AlertLane — dismiss all to reach the all-clear strip */}
            <div>
              <Text variant="label" className="mb-2 block">
                ④ AlertLane · critical=Acknowledge · warning/info=dismiss · collapse · all-clear
              </Text>
              <AlertLane
                alerts={[
                  {
                    id: 'ds-crit',
                    severity: 'critical',
                    iconSignature: 'fees',
                    title: 'Overdue invoices — NPR 8.8 lakh uncollected',
                    description: 'Collection rate is 18.1%. Outstanding overdue requires follow-up.',
                    cta: { label: 'Review billing', onAction: () => undefined },
                  },
                  {
                    id: 'ds-warn',
                    severity: 'warning',
                    iconSignature: 'attendance',
                    title: '16 students below 80% attendance',
                    description: 'Attendance requires intervention — today 18.8%, 30-day avg 78%.',
                    cta: { label: 'View students', onAction: () => undefined },
                  },
                  {
                    id: 'ds-info',
                    severity: 'info',
                    title: '206 students without an attendance record today',
                    description: 'Attendance has not yet been recorded for all sections.',
                    cta: { label: 'Take attendance', onAction: () => undefined },
                  },
                ] satisfies DashboardAlert[]}
              />
            </div>

            {/* ⑤ WidgetCard grid — spans + ready/empty/loading states */}
            <div>
              <Text variant="label" className="mb-2 block">
                ⑤ WidgetCard · 12-col spans · one-of metric|link · ready / empty / loading
              </Text>
              <WidgetGrid>
                <WidgetCard
                  title="Attendance trend"
                  iconSignature="attendance"
                  subtitle="30-day rolling average · school-wide"
                  span={8}
                  footer={<Text variant="secondary">View Attendance →</Text>}
                >
                  <div className="flex h-32 items-center justify-center rounded-lg bg-background-tertiary text-text-tertiary">
                    <Text variant="secondary">line chart body</Text>
                  </div>
                </WidgetCard>
                <WidgetCard title="Financial overview" iconSignature="fees" subtitle="18.1% collected" span={4} metric="NPR 10.1L due">
                  <div className="flex h-32 items-center justify-center rounded-lg bg-background-tertiary text-text-tertiary">
                    <Text variant="secondary">progress rows</Text>
                  </div>
                </WidgetCard>
                <WidgetCard
                  title="At-risk students"
                  iconSignature="atrisk"
                  span={4}
                  link={{ label: 'View all', href: '#' }}
                  state="empty"
                  empty={{ iconSignature: 'students', title: 'No at-risk students', subtitle: 'Everyone is above 80% attendance' }}
                >
                  placeholder
                </WidgetCard>
                <WidgetCard title="Recent activity" iconSignature="overview" span={4} state="loading">
                  placeholder
                </WidgetCard>
                <WidgetCard title="Quick actions" iconSignature="create" span={4}>
                  <div className="flex h-32 items-center justify-center rounded-lg bg-background-tertiary text-text-tertiary">
                    <Text variant="secondary">action grid</Text>
                  </div>
                </WidgetCard>
              </WidgetGrid>
            </div>
          </Stack>
        </SectionCard>
      </Stack>
    </PageShell>
  )
}

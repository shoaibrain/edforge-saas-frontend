/**
 * Landing V2 copy catalog — single source of truth.
 *
 * Every user-visible string on the landing surface lives here. Sections import
 * from this file; no hardcoded copy in JSX from Sprint 1 onward.
 *
 * Strings are lifted verbatim from the Claude Design bundle at
 * `temp/edforge-landing-page/project/components/*.jsx`. Marketing editorial
 * sign-off is a Sprint 7 gate (S7-T15); until then this is the ship copy.
 */

export const HERO = {
  headingLead: 'One platform to power',
  headingSerif: 'every school',
  headingTail: 'in your district.',
  lede: 'Unify student data, school operations, and district analytics on one modern, FERPA-compliant platform — designed to replace legacy systems, not add to them.',
  scrollHint: 'Learn about Edforge',
  ctaPrimary: 'Explore use cases',
  ctaPrimaryHref: '#use-cases',
  trustBadges: [
    'FERPA & COPPA by design',
    'Built with educators',
    'Migrates your legacy SIS',
  ],
} as const

export type UseCaseFeature = {
  id: string
  title: string
  highlight: string
  titleSuffix?: string
  description: string
  /** Chapter start time in seconds within the video. */
  start: number
}

export const USE_CASE_DISTRICT = {
  id: 'use-cases',
  eyebrow: 'FOR DISTRICT LEADERS',
  headingLead: 'Run your district from',
  headingSerif: 'one calm',
  headingTail: 'dashboard —\nnot twelve frantic tabs.',
  lede: 'Budget, staffing, enrollment, and performance across every campus. Leaders stop chasing the data and start acting on it.',
  mediaLength: '1:42',
  accent: 'var(--lp-primary)',
  features: [
    {
      id: 'budget',
      title: 'Budget clarity, not spreadsheets',
      highlight: 'Budget clarity',
      titleSuffix: ', not spreadsheets',
      description:
        'Track real-time spending against allocations for every department and campus. Surface variances before they become problems. Export board-ready reports in one click.',
      start: 0,
    },
    {
      id: 'campus',
      title: 'Every campus at a glance',
      highlight: 'campus',
      titleSuffix: 'Every  at a glance',
      description:
        'Enrollment, attendance, staff capacity, and incident trends — standardized across all 12 schools so cross-campus comparisons actually mean something.',
      start: 12,
    },
    {
      id: 'workforce',
      title: 'Know your workforce',
      highlight: 'workforce',
      titleSuffix: 'Know your ',
      description:
        'Certification status, contract renewals, PD hours, and coverage gaps — so HR stops chasing spreadsheets and starts planning ahead.',
      start: 24,
    },
    {
      id: 'dashboards',
      title: 'Board-ready dashboards',
      highlight: 'dashboards',
      titleSuffix: 'Board-ready ',
      description:
        'Pre-built templates for superintendent updates, board meetings, and state reporting. No more 2am PowerPoint crunches.',
      start: 36,
    },
  ] satisfies UseCaseFeature[],
} as const

export const USE_CASE_TEACHERS = {
  id: 'teachers-parents',
  eyebrow: 'FOR TEACHERS & PARENTS',
  headingLead: 'Teachers and parents,\nfinally on the',
  headingSerif: 'same page',
  headingTail: '.',
  lede: 'Real-time grades, attendance, and schedules — visible to both teachers and families, in the language each family speaks. No phone tag. No paper slips.',
  mediaLength: '2:08',
  accent: 'var(--lp-teal)',
  features: [
    {
      id: 'class',
      title: 'Your class, organized',
      highlight: 'organized',
      titleSuffix: 'Your class, ',
      description:
        'Attendance, gradebook, seating charts, assignments, and IEP notes in one view — designed for the teacher, not the DBA.',
      start: 0,
    },
    {
      id: 'messages',
      title: 'Messages that reach families',
      highlight: 'reach families',
      titleSuffix: 'Messages that ',
      description:
        'Two-way messaging with auto-translation for 40+ languages. Send home reminders, forms, and progress updates that parents actually open.',
      start: 15,
    },
    {
      id: 'progress',
      title: 'Student progress, visualized',
      highlight: 'visualized',
      titleSuffix: 'Student progress, ',
      description:
        'Skill mastery, trend lines, and risk flags — teachers spot struggling students weeks earlier.',
      start: 30,
    },
    {
      id: 'parents',
      title: 'Parents stay involved',
      highlight: 'involved',
      titleSuffix: 'Parents stay ',
      description:
        'Parents see the same data teachers see. Conference scheduling, assignment tracking, and daily summaries — no phone tag required.',
      start: 45,
    },
  ] satisfies UseCaseFeature[],
} as const

export const USE_CASE_STUDENTS = {
  id: 'students',
  eyebrow: 'FOR STUDENTS',
  headingLead: 'A portal students actually\n',
  headingSerif: 'want',
  headingTail: ' to open.',
  lede: 'Grades, assignments, schedules, and progress — clear, personal, and designed for how students actually study. No jargon. No clutter.',
  mediaLength: '1:26',
  accent: 'var(--lp-blue)',
  features: [
    {
      id: 'courses',
      title: 'All your courses, one place',
      highlight: 'one place',
      titleSuffix: 'All your courses, ',
      description:
        'Assignments, due dates, grades, and reading lists — across every subject, organized so nothing slips.',
      start: 0,
    },
    {
      id: 'earn',
      title: 'Earn as you learn',
      highlight: 'Earn',
      titleSuffix: ' as you learn',
      description:
        'Skill badges, streaks, and achievement milestones that make progress tangible — without turning school into a video game.',
      start: 12,
    },
    {
      id: 'grades',
      title: 'Grades you can understand',
      highlight: 'understand',
      titleSuffix: 'Grades you can ',
      description:
        'Rubric-based feedback that shows exactly what a teacher looked for and what to improve — not a cryptic letter grade.',
      start: 24,
    },
    {
      id: 'focus',
      title: 'Know what to focus on',
      highlight: 'focus',
      titleSuffix: 'Know what to  on',
      description:
        'Personalized recommendations based on your performance. See which subjects need attention and what to study next.',
      start: 36,
    },
  ] satisfies UseCaseFeature[],
} as const

export const PLATFORM_PILLARS = {
  eyebrow: 'EDFORGE APP',
  headingLead: 'Everything your district runs on —',
  headingSerif: 'thoughtfully connected',
  headingTail: '.',
  lede: 'Six modules, one shared data model, one login for every role. Start with what matters most this year — turn on the rest when your team is ready.',
  cards: [
    {
      id: 'core',
      title: 'Run school operations with Edforge Core',
      description:
        'SIS, enrollment, attendance, and discipline — the central nervous system of a modern district.',
      colSpan: 7,
      visual: 'core',
    },
    {
      id: 'analytics',
      title: 'See every signal with Analytics',
      description:
        'Early-warning dashboards, cohort insights, and state-reporting built into one live view.',
      colSpan: 5,
      visual: 'analytics',
    },
    {
      id: 'finance',
      title: 'Automate the finance back office',
      description:
        'Payroll, fees, budgets, vendor management — automated, audit-ready, and zero spreadsheets.',
      colSpan: 5,
      visual: 'finance',
    },
    {
      id: 'chat',
      title: 'Reach every family with Communications',
      description:
        'Real-time messaging with auto-translation for 40+ languages, so no parent is left out of the loop.',
      colSpan: 7,
      visual: 'chat',
    },
    {
      id: 'calendar',
      title: 'Schedule classes, exams, and campuses',
      description:
        'Timetables and calendars that talk to each other — across buildings, bells, and academic years.',
      colSpan: 6,
      visual: 'calendar',
    },
    {
      id: 'api',
      title: 'Extend anything with our platform & API',
      description:
        'SSO, webhooks, and a full REST + GraphQL API. If it matters, Edforge can talk to it.',
      colSpan: 6,
      visual: 'api',
    },
  ],
} as const

export const SECURITY_STRIP = {
  tag: 'Trust, built-in',
  headingLead: 'Student data is',
  headingSerif: 'sacred',
  headingTail: '.\nWe treat it that way.',
  lede: "Parents, teachers, and district leaders shouldn't need a legal team to understand how a platform handles a child's records. Here's ours, in plain language.",
  promises: [
    {
      icon: 'lock',
      title: 'Encrypted, always.',
      description:
        'AES-256 at rest, TLS 1.3 in transit. Keys rotate automatically — no exceptions, no backdoors.',
    },
    {
      icon: 'users',
      title: 'Least-privilege access.',
      description:
        'Every teacher, parent, and admin sees only what their role needs — with a full audit trail.',
    },
    {
      icon: 'privacy',
      title: 'Your data stays yours.',
      description:
        'We never sell, share, or train AI on student data. Ever. Export everything, anytime.',
    },
  ],
  frameworksLabel: 'Built to the standards that matter',
  frameworks: ['FERPA', 'COPPA', 'GDPR', 'SOC 2', 'ISO 27001', 'SSDPC'],
  cta: 'Read our privacy promise',
  ctaHref: '/privacy',
} as const

export const MIGRATION = {
  eyebrow: 'THE EDFORGE SWITCH',
  headingLead: 'Ripping out legacy software',
  headingSerif: "shouldn't",
  headingTail: '\nfeel like ripping off a bandage.',
  lede: 'Our white-glove migration crew does the heavy lifting — from the SQL joins nobody documented to the "how do we actually run report cards" institutional knowledge. You keep teaching. We\'ll handle the wiring.',
  steps: [
    {
      week: 'Week 1',
      title: 'Listen first',
      description:
        'We sit with your team, map the real workflows, and find the skeletons in your SIS.',
      emoji: '👂',
    },
    {
      week: 'Week 2',
      title: 'Move the mountain',
      description:
        'Our engineers migrate every student record, roster, grade, and audit trail. No data left behind.',
      emoji: '⛰️',
    },
    {
      week: 'Week 3',
      title: 'Train the crew',
      description:
        "Role-based training that respects your staff's time — and makes them actually excited to log in.",
      emoji: '🎓',
    },
    {
      week: 'Week 4',
      title: 'Flip the switch',
      description:
        'Parallel run, cutover weekend, and a human on Slack at 2am if your principal needs us.',
      emoji: '🚀',
    },
  ],
  days: '30',
  daysHeadline: 'Days, start to finish.',
  daysSub: 'Not 30 months. Not 30 meetings. Thirty days.',
  sampleLink: 'See a sample migration plan',
  sampleHref: 'mailto:hello@edforge.app?subject=Migration%20plan%20sample',
} as const

export const FAQ = {
  eyebrow: 'FAQS',
  headingLead: 'Have questions?',
  headingSerif: "We've got answers.",
  items: [
    {
      q: 'What exactly is Edforge — is it an SIS, an LMS, or something else?',
      a: 'Edforge is a modern EMIS (Education Management Information System). It combines the functions traditionally split across an SIS, finance system, and communications tool — all on one data model, with a single login. It replaces legacy software rather than sitting on top of it.',
    },
    {
      q: 'We already use PowerSchool / Infinite Campus / Skyward. How does migration work?',
      a: 'We run a 30-day white-glove migration. Our engineers handle the data export, mapping, and validation — including historical records, grades, attendance, and audit trails. You keep teaching while we handle the wiring. Parallel-run the final week, then cut over.',
    },
    {
      q: 'How does Edforge handle student data privacy?',
      a: 'Student data is encrypted at rest (AES-256) and in transit (TLS 1.3). We never sell, share, or train AI on student data. We operate against FERPA, COPPA, GDPR, SOC 2, ISO 27001, and the Student Data Privacy Consortium (SSDPC) framework. You can export everything, anytime.',
    },
    {
      q: 'Does Edforge work with Google Workspace or Microsoft 365?',
      a: 'Yes — SSO via Google, Microsoft, or any SAML/OIDC provider. Roster sync, calendar sync, and document handoff are on the roadmap as integrations are added based on customer demand.',
    },
    {
      q: 'What about translation and accessibility for families?',
      a: 'Communications auto-translates across 40+ languages in real time. All student- and family-facing surfaces meet WCAG 2.1 AA; we test with screen readers and keyboard navigation on every release.',
    },
    {
      q: "We're a small district. Is Edforge built for us?",
      a: "Yes. Edforge is designed to scale from a single-school charter up to statewide deployments. Pricing is transparent and per-student, so you don't pay for features you don't use.",
    },
  ],
} as const

export const FINAL_CTA = {
  headingLead: "Let's forge something",
  headingSerif: 'better',
  headingTail: '\nfor your district together.',
  lede: "We're onboarding early design-partner districts now. Join a 30-minute working session to see Edforge and help shape what comes next.",
  cta: 'Talk to our team',
  ctaHref: 'mailto:hello@edforge.app',
} as const

export const FOOTER = {
  tagline:
    'The modern EMIS platform for K–12 schools. Built by educators, engineers, and school operators.',
  legalEntity: 'Edforge Technologies, Inc.',
  copyright: '© 2026 Edforge Technologies, Inc. All rights reserved.',
  columns: [
    {
      heading: 'Product',
      items: [
        { label: 'Edforge Core', href: '#' },
        { label: 'Analytics', href: '#' },
        { label: 'Finance', href: '#' },
        { label: 'Communications', href: '#' },
        { label: 'Platform & API', href: '#' },
      ],
    },
    {
      heading: 'Solutions',
      items: [
        { label: 'District Leaders', href: '#use-cases' },
        { label: 'Teachers & Parents', href: '#teachers-parents' },
        { label: 'Students', href: '#students' },
        { label: 'Principals', href: '#' },
      ],
    },
    {
      heading: 'Resources',
      items: [
        { label: 'Documentation', href: '#' },
        { label: 'Security Center', href: '/security' },
        { label: 'Privacy', href: '/privacy' },
        { label: 'Changelog', href: '#' },
      ],
    },
    {
      heading: 'Company',
      items: [
        { label: 'About', href: '/about' },
        { label: 'Careers', href: '#' },
        { label: 'Contact', href: '/contact' },
        { label: 'Press', href: '#' },
      ],
    },
  ],
  legalLinks: [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Security', href: '/security' },
    { label: 'Accessibility', href: '/legal/accessibility' },
  ],
} as const

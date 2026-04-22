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
  headingSerif1: 'Well-run',
  headingMid: ' schools teach better.\nWe built Edforge around ',
  headingSerif2: 'that idea',
  headingTail: '.',
  lede: "One modern, secure platform for student records, school operations, family communication, and analytics — so the people running schools can spend their energy on the people they're running them for.",
  scrollHint: 'See Edforge',
  ctaPrimary: 'See Edforge',
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
  eyebrow: 'FOR SCHOOL LEADERS',
  headingLead: 'Lead from',
  headingSerif: 'what matters',
  headingTail: ",\nnot what's loudest.",
  lede: "The World Bank's SABER framework identifies three traits shared by effective school management systems: a single source of truth, real-time visibility, and data that reaches the people making decisions. Edforge is built on all three — because operational clarity is how learning outcomes compound, year after year.",
  mediaLength: '1:42',
  accent: 'var(--lp-primary)',
  features: [
    {
      id: 'truth',
      title: 'A single source of truth.',
      highlight: 'single source of truth',
      titleSuffix: 'A .',
      description:
        'Student records, attendance, academics, staffing, and finance — one system, one schema, one login. The end of reconciling three tools that disagree with each other.',
      start: 0,
    },
    {
      id: 'visibility',
      title: 'Real-time visibility.',
      highlight: 'Real-time',
      titleSuffix: ' visibility.',
      description:
        "Trends visible while they're still addressable, not in next quarter's report. Leaders see a full-week attendance drop on Wednesday, not in a Friday summary email.",
      start: 12,
    },
    {
      id: 'decisions',
      title: 'Decisions that reach the classroom.',
      highlight: 'Decisions',
      titleSuffix: ' that reach the classroom.',
      description:
        'Every insight pairs with a clear next step — a call, a meeting, a policy review. Clarity is only useful when it leads to action.',
      start: 24,
    },
  ] satisfies UseCaseFeature[],
} as const

export const USE_CASE_TEACHERS = {
  id: 'teachers-parents',
  eyebrow: 'FOR TEACHERS & FAMILIES',
  headingLead: 'Between a teacher and a family,\nonly the',
  headingSerif: 'student',
  headingTail: ' should be in the way.',
  lede: "For too long, schools and families have talked past each other — through folders that get lost, apps that nobody opens, portals that nobody remembers the password to. Edforge puts the conversation where it belongs: on the family's phone, in the family's language, with the teacher one tap away.",
  mediaLength: '2:08',
  accent: 'var(--lp-teal)',
  features: [
    {
      id: 'language',
      title: 'Every family, their own language.',
      highlight: 'Every family',
      titleSuffix: ', their own language.',
      description:
        'Auto-translation covers 40+ languages in both directions. A family speaking Newari at home reads the teacher in Newari. The teacher reads the reply in English. The technology stays out of the way.',
      start: 0,
    },
    {
      id: 'progress',
      title: "A record of a child's progress.",
      highlight: 'record',
      titleSuffix: "A  of a child's progress.",
      description:
        'Grades, attendance, and teacher notes in one place that updates in real time — so a family asking "how\'s my kid doing?" gets a full answer, not just a report card four times a year.',
      start: 15,
    },
    {
      id: 'message',
      title: 'The message that actually gets sent.',
      highlight: 'actually gets sent',
      titleSuffix: 'The message that .',
      description:
        'Templates, tone presets, voice-to-text, translation — all built in so reaching home takes three taps, not thirty minutes. When contact is easy, contact happens.',
      start: 30,
    },
  ] satisfies UseCaseFeature[],
} as const

export const USE_CASE_STUDENTS = {
  id: 'students',
  eyebrow: 'FOR STUDENTS',
  headingLead: 'A school tool that respects\nthe student',
  headingSerif: 'using it',
  headingTail: '.',
  lede: "Most school software was designed by enterprise software companies for compliance, not by anyone who's watched a teenager try to use it at 7 AM on a Tuesday. Edforge's student experience was built the other way around: start with the student, honor their time, and earn the tap.",
  mediaLength: '1:26',
  accent: 'var(--lp-blue)',
  features: [
    {
      id: 'view',
      title: 'Their learning, in their view.',
      highlight: 'Their learning',
      titleSuffix: ', in their view.',
      description:
        "Grades, assignments, schedule, and progress — laid out the way a student actually thinks about them. Not as an administrator's filing system.",
      start: 0,
    },
    {
      id: 'help',
      title: 'Help that teaches, not solves.',
      highlight: 'teaches',
      titleSuffix: 'Help that , not solves.',
      description:
        'When a student asks for help, the platform asks them better questions back. AI assistance that builds understanding, with a summary the teacher can see — and private details the student keeps.',
      start: 12,
    },
    {
      id: 'safe',
      title: 'Safe by default.',
      highlight: 'Safe',
      titleSuffix: ' by default.',
      description:
        "Messaging scoped to teachers and classmates in their own school. Clear reporting paths. Notifications that respect sleep. Nothing about the app should add to a young person's stress.",
      start: 24,
    },
  ] satisfies UseCaseFeature[],
} as const

export const PLATFORM_PILLARS = {
  eyebrow: 'HOW IT ALL CONNECTS',
  headingLead: 'Six modules. One data model.\nEvery decision',
  headingSerif: 'traceable to a student',
  headingTail: '.',
  lede: "Edforge is built on the Ed-Fi data standard — the same open specification used across the world's most data-mature education systems. Every module shares one schema, which means every question you ask connects cleanly back to the student it's about.",
  cards: [
    {
      id: 'core',
      title: 'Edforge Core',
      description:
        'Enrollment, attendance, discipline, and demographics. The foundational record of every student, built to open standards.',
      colSpan: 7,
      visual: 'core',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description:
        "Early-warning indicators drawn from education research. See patterns forming while there's still time to act.",
      colSpan: 5,
      visual: 'analytics',
    },
    {
      id: 'finance',
      title: 'Finance',
      description:
        'Budgets, fees, payroll, and vendor management. Every dollar traceable to the program it funded.',
      colSpan: 5,
      visual: 'finance',
    },
    {
      id: 'chat',
      title: 'Communications',
      description:
        'Real-time messaging with auto-translation in 40+ languages. Delivered to app, email, or SMS — whichever a family uses.',
      colSpan: 7,
      visual: 'chat',
    },
    {
      id: 'calendar',
      title: 'Scheduling',
      description:
        'Classes, teachers, rooms, and calendars that talk to each other across every school in the network.',
      colSpan: 6,
      visual: 'calendar',
    },
    {
      id: 'api',
      title: 'Platform & API',
      description:
        'SSO, webhooks, full REST and GraphQL APIs. Your data is yours. Export it, integrate it, extend it.',
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
  lede: "Parents, teachers, and school leaders shouldn't need a legal team to understand how a platform handles a child's records. Here's ours, in plain language.",
  promises: [
    {
      icon: 'lock',
      title: 'Encrypted, always.',
      description:
        'AES-256 at rest, TLS 1.3 in transit. Keys rotate automatically. Data is protected by design, not by exception.',
    },
    {
      icon: 'users',
      title: 'Least-privilege access.',
      description:
        'Every teacher, family member, and administrator sees only what their role requires — with a full audit trail behind every record.',
    },
    {
      icon: 'privacy',
      title: 'Your data stays yours.',
      description:
        "We don't sell it. We don't share it. We don't train AI on it. Your school can export everything, anytime, in an open format.",
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
      emoji: '\uD83D\uDC42',
    },
    {
      week: 'Week 2',
      title: 'Move the mountain',
      description:
        'Our engineers migrate every student record, roster, grade, and audit trail. No data left behind.',
      emoji: '\u26F0\uFE0F',
    },
    {
      week: 'Week 3',
      title: 'Train the crew',
      description:
        "Role-based training that respects your staff's time — and makes them actually excited to log in.",
      emoji: '\uD83C\uDF93',
    },
    {
      week: 'Week 4',
      title: 'Flip the switch',
      description:
        'Parallel run, cutover weekend, and a human on Slack at 2am if your principal needs us.',
      emoji: '\uD83D\uDE80',
    },
  ],
  days: '30',
  daysHeadline: 'Days, start to finish.',
  daysSub: 'Not 30 months. Not 30 meetings. Thirty days.',
  sampleLink: 'See a sample migration plan',
  sampleHref: 'mailto:shoaib@edforge.app?subject=Migration%20plan%20sample',
} as const

export const FAQ = {
  eyebrow: 'FAQS',
  headingLead: 'Have questions?',
  headingSerif: "We've got answers.",
  items: [
    {
      q: 'What exactly is Edforge?',
      a: 'A modern school management platform that brings student records, communications, finance, scheduling, and analytics into one system. Designed for schools and school networks that want a single source of truth instead of a patchwork of disconnected tools.',
    },
    {
      q: 'Who built Edforge? What stage is it at?',
      a: "Edforge is an early-stage platform, designed and engineered by a small, focused team drawing on research from the World Bank's SABER framework, the EdTech Hub, the U.S. Department of Education, and the Ed-Fi standards community. We're building in the open, with pilot schools leading the way.",
    },
    {
      q: 'Is Edforge ready to replace what we have today?',
      a: "For the right schools, yes. We're currently onboarding early partner schools and building alongside them. If you're curious whether that describes your school, we'd love a conversation.",
    },
    {
      q: 'How does Edforge handle student data privacy?',
      a: 'Encrypted end-to-end. Role-based access with full audit logs. Built to FERPA, COPPA, and GDPR standards. We never sell, share, or train AI on student data.',
    },
    {
      q: 'Does Edforge work with Google Workspace or Microsoft 365?',
      a: 'Yes, natively. Single sign-on, calendar sync, assignments integration.',
    },
    {
      q: 'What languages do families get messages in?',
      a: '40+ and growing. Auto-translation runs in both directions — teachers write in their language, families read in theirs.',
    },
  ],
} as const

export const FINAL_CTA = {
  headingLead: 'A platform this important should be',
  headingSerif: 'built with you',
  headingTail: ',\nnot sold to you.',
  lede: "We're at the early stage — where the people who use Edforge also help decide what it becomes. If your school is ready for a modern system and an unusual partnership, we'd like to talk.",
  cta: 'Start the conversation',
  ctaHref: 'mailto:shoaib@edforge.app',
  ctaMicro: 'No slide deck. No pressure. A 30-minute working session.',
} as const

export const FOOTER = {
  tagline:
    'The modern EMIS platform for K-12 schools. Built by educators, engineers, and school operators.',
  legalEntity: 'Edforge Technologies, Inc.',
  copyright: '\u00A9 2026 Edforge Technologies, Inc. All rights reserved.',
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
        { label: 'School Leaders', href: '#use-cases' },
        { label: 'Teachers & Families', href: '#teachers-parents' },
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

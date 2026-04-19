import { track } from '@vercel/analytics'

/**
 * Landing-v2 analytics event contract.
 *
 * Single source of truth for what we emit from the marketing page. Rules:
 *   - Event names use snake_case and are prefixed `landing_`.
 *   - Payloads are shallow strings / numbers only — no PII, no objects.
 *   - New events get a typed helper here, not ad-hoc `track()` calls.
 *
 * Dashboards and downstream pipelines read these names; do not rename
 * without a migration note.
 */

type HeroCtaName = 'explore_usecases' | 'scroll_hint'
type UseCaseSectionId = 'use-cases' | 'teachers-parents' | 'students'
type PillarId = 'core' | 'analytics' | 'finance' | 'chat' | 'calendar' | 'api'
type FinalCtaName = 'talk_to_team'
type SecurityCtaName = 'privacy_promise'

export const landingEvents = {
  heroCtaClick(cta: HeroCtaName) {
    track('landing_hero_cta_click', { cta })
  },

  useCaseFeatureClick(section: UseCaseSectionId, featureIndex: number, featureId: string) {
    track('landing_usecase_feature_click', {
      section,
      feature_index: featureIndex,
      feature_id: featureId,
    })
  },

  pillarCardClick(pillar: PillarId) {
    track('landing_pillar_card_click', { pillar })
  },

  faqOpen(questionIndex: number) {
    track('landing_faq_open', { question_index: questionIndex })
  },

  securityCtaClick(cta: SecurityCtaName) {
    track('landing_security_cta_click', { cta })
  },

  finalCtaClick(cta: FinalCtaName) {
    track('landing_final_cta_click', { cta })
  },

  pageView() {
    track('landing_page_view')
  },
}

export type LandingEvents = typeof landingEvents

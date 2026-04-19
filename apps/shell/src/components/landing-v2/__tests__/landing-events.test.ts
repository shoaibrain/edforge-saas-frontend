import { describe, it, expect, beforeEach, vi } from 'vitest'

// Stub @vercel/analytics before importing the subject — the real module
// ships browser-only code that throws in jsdom.
const trackSpy = vi.fn()
vi.mock('@vercel/analytics', () => ({
  track: (...args: unknown[]) => trackSpy(...args),
}))

import { landingEvents } from '../../../analytics/landing-events'

describe('landingEvents contract', () => {
  beforeEach(() => {
    trackSpy.mockReset()
  })

  it('heroCtaClick fires landing_hero_cta_click with typed cta name', () => {
    landingEvents.heroCtaClick('explore_usecases')
    expect(trackSpy).toHaveBeenCalledWith('landing_hero_cta_click', {
      cta: 'explore_usecases',
    })
  })

  it('useCaseFeatureClick fires with section + index + id', () => {
    landingEvents.useCaseFeatureClick('use-cases', 2, 'workforce')
    expect(trackSpy).toHaveBeenCalledWith('landing_usecase_feature_click', {
      section: 'use-cases',
      feature_index: 2,
      feature_id: 'workforce',
    })
  })

  it('pillarCardClick fires with pillar id only', () => {
    landingEvents.pillarCardClick('analytics')
    expect(trackSpy).toHaveBeenCalledWith('landing_pillar_card_click', {
      pillar: 'analytics',
    })
  })

  it('faqOpen fires with question_index', () => {
    landingEvents.faqOpen(4)
    expect(trackSpy).toHaveBeenCalledWith('landing_faq_open', {
      question_index: 4,
    })
  })

  it('securityCtaClick + finalCtaClick + pageView all emit their events', () => {
    landingEvents.securityCtaClick('privacy_promise')
    landingEvents.finalCtaClick('talk_to_team')
    landingEvents.pageView()
    expect(trackSpy.mock.calls[0]).toEqual([
      'landing_security_cta_click',
      { cta: 'privacy_promise' },
    ])
    expect(trackSpy.mock.calls[1]).toEqual([
      'landing_final_cta_click',
      { cta: 'talk_to_team' },
    ])
    expect(trackSpy.mock.calls[2]).toEqual(['landing_page_view'])
  })

  it('never emits PII-shaped fields (email / name / phone) in payloads', () => {
    // Fire every public method with representative args.
    landingEvents.heroCtaClick('explore_usecases')
    landingEvents.useCaseFeatureClick('teachers-parents', 1, 'messages')
    landingEvents.pillarCardClick('core')
    landingEvents.faqOpen(0)
    landingEvents.securityCtaClick('privacy_promise')
    landingEvents.finalCtaClick('talk_to_team')
    landingEvents.pageView()

    const forbiddenKeys = ['email', 'name', 'phone', 'userId', 'user_id']
    for (const call of trackSpy.mock.calls) {
      const payload = call[1] as Record<string, unknown> | undefined
      if (!payload) continue
      for (const key of forbiddenKeys) {
        expect(payload, `payload has forbidden key ${key}`).not.toHaveProperty(key)
      }
    }
  })
})

# Shell — Public landing

**Seed:** none (public surface, unauthenticated)

The landing v2 marketing surface at `/` plus public sub-pages. Existing
coverage lives in `e2e/tests/landing-v2-hero.spec.ts`, `landing-v2-cta.spec.ts`,
`landing-v2-faq.spec.ts` — this plan consolidates the surface for the planner
agent; do not duplicate those specs when generating.

### 1. Existing coverage (do not regenerate)
- Hero: parallax, video readiness, scroll hint, reduced-motion fallback
- CTA block links
- FAQ accordion

### 2. Gaps to plan when this surface changes
- Public sub-pages render: `/about`, `/contact`, `/privacy`, `/terms`,
  `/security`, `/legal/accessibility`
- Unauthenticated `/` shows the landing page (no auto-redirect to /login)
- "Sign in" entry point navigates to `/login`

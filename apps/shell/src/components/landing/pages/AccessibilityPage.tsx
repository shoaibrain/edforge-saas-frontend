import { useEffect } from 'react'

/**
 * AccessibilityPage — stub route for /legal/accessibility. The landing
 * footer (from landing-v2) links here. Real copy is a marketing/legal
 * follow-up; this stub satisfies the link target so no 404 from the footer.
 */
export default function AccessibilityPage() {
  useEffect(() => {
    document.title = 'Accessibility — EdForge'
  }, [])

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-tight">
          Accessibility
        </h1>
        <p className="text-sm text-muted-foreground mb-12">
          Our commitment to users with disabilities.
        </p>

        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Our commitment</h2>
            <p className="leading-relaxed">
              EdForge is designed so that every school operator and educator can use
              the platform, regardless of ability. We are working toward WCAG 2.1 AA
              conformance and continuously improve keyboard navigation, screen-reader
              support, and color-contrast across the product.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Report an issue</h2>
            <p className="leading-relaxed">
              If you encounter a barrier using EdForge, please write to{' '}
              <a
                href="mailto:shoaibrain@edforge.net"
                className="text-primary underline underline-offset-4"
              >
                shoaibrain@edforge.net
              </a>
              . We read every report and will respond as quickly as we can.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

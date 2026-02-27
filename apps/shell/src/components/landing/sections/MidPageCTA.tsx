import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

export function MidPageCTA() {
  return (
    <section className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl lg:text-4xl">
          Ready to see it in action?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base md:text-lg">
          Join forward-thinking schools modernizing education management with EdForge.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25"
          >
            Start Free Trial
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="mailto:shoaibrain@edforge.net?subject=EdForge%20Demo%20Request"
            className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted/20"
          >
            Schedule a Demo
          </a>
        </div>
      </div>
    </section>
  )
}

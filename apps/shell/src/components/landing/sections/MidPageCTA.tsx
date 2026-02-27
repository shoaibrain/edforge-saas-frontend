import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

export function MidPageCTA() {
  return (
    <section className="py-16 sm:py-20" aria-label="Call to action">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl lg:text-4xl" style={{ color: '#e8edf0' }}>
          Ready to see EdForge in your district?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base md:text-lg" style={{ color: '#8aafbf' }}>
          See how one platform replaces your SIS, HR system, and reporting tools.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 rounded-full px-8 py-3 text-base font-semibold transition-colors duration-200"
            style={{ backgroundColor: '#2a9d8f', color: '#050b0f' }}
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <a
            href="mailto:shoaibrain@edforge.net?subject=EdForge%20Demo%20Request"
            className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-base font-medium transition-colors duration-200 hover:bg-white/5"
            style={{ border: '1px solid rgba(42,157,143,0.2)', color: '#e8edf0' }}
          >
            Request a Demo
          </a>
        </div>
      </div>
    </section>
  )
}

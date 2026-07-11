import { useEffect } from 'react'

export default function AboutPage() {
  useEffect(() => {
    document.title = 'About — EdForge'
  }, [])

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight">About EdForge</h1>
        <p className="text-base text-muted-foreground mb-8 leading-relaxed sm:text-lg">
          EdForge is building the next generation of education management infrastructure. We believe schools deserve
          modern, event-driven systems that evolve with the needs of students, teachers, and administrators.
        </p>

        <div className="space-y-12">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4 sm:text-2xl">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              To provide schools with a modern Education Management Information System (EMIS) that is
              intuitive, secure, and built on open standards. We aim to eliminate the friction of legacy
              systems and empower every stakeholder in the education ecosystem.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4 sm:text-2xl">What We Build</h2>
            <p className="text-muted-foreground leading-relaxed">
              EdForge is an event-driven platform that handles student information, academic management, financial
              operations, and staff records — all in one unified system. Our micro-frontend
              architecture ensures that each module is independently deployable and scalable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4 sm:text-2xl">Our Approach</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong className="text-foreground">Privacy-first:</strong> Designed for FERPA, COPPA, and GDPR from the ground up.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong className="text-foreground">Open standards:</strong> Built on Ed-Fi data standards for interoperability.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong className="text-foreground">Modern stack:</strong> React micro-frontends and event-driven architecture.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4 sm:text-2xl">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              EdForge Technologies<br />
              <a href="mailto:shoaib@edforge.app" className="text-primary hover:underline">shoaib@edforge.app</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

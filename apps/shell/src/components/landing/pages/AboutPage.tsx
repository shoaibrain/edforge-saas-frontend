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
              To provide schools with an enterprise-grade Education Management Information System (EMIS) that is
              intuitive, secure, and built for the agent-first era. We aim to eliminate the friction of legacy
              systems and empower every stakeholder in the education ecosystem.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4 sm:text-2xl">What We Build</h2>
            <p className="text-muted-foreground leading-relaxed">
              EdForge is an event-driven platform that handles student information, academic management, human
              resources, financial operations, and analytics — all in one unified system. Our micro-frontend
              architecture ensures that each module is independently deployable and scalable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4 sm:text-2xl">Our Approach</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong className="text-foreground">Privacy-first:</strong> FERPA compliant, COPPA ready, and GDPR compatible by design.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong className="text-foreground">Open standards:</strong> Built on Ed-Fi data standards for interoperability.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong className="text-foreground">Modern stack:</strong> React, event-driven architecture, and AI-ready infrastructure.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4 sm:text-2xl">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              EdForge Technologies LLC<br />
              6600 McKinney Ranch Parkway, McKinney, TX 75070<br />
              <a href="mailto:shoaibrain@edforge.net" className="text-primary hover:underline">shoaibrain@edforge.net</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

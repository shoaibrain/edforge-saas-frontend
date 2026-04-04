import { useEffect } from 'react'

export default function PrivacyPage() {
  useEffect(() => {
    document.title = 'Privacy Policy — EdForge'
  }, [])

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: February 2026</p>

        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Overview</h2>
            <p className="leading-relaxed">
              EdForge Technologies LLC ("EdForge", "we", "us") is committed to protecting the privacy of students,
              educators, parents, and all users of our platform. This Privacy Policy describes how we collect, use,
              and protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Data We Collect</h2>
            <p className="leading-relaxed mb-4">We collect the minimum data necessary to operate the platform:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong className="text-foreground">Account data:</strong> Name, email address, role, and school affiliation.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong className="text-foreground">Educational records:</strong> Student academic data, grades, attendance, and enrollment information as provided by schools.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong className="text-foreground">Usage data:</strong> Analytics about how the platform is used to improve our services.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">FERPA Compliance</h2>
            <p className="leading-relaxed">
              EdForge acts as a "school official" under FERPA. We access educational records solely to provide services
              to schools and districts. We do not use student data for advertising or marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">COPPA Compliance</h2>
            <p className="leading-relaxed">
              For students under 13, schools provide the necessary consent on behalf of parents in accordance with COPPA
              regulations. We do not collect personal information directly from children without school authorization.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Data Security</h2>
            <p className="leading-relaxed">
              We implement industry-standard security measures including encryption at rest and in transit,
              role-based access controls, and regular security audits. See our{' '}
              <a href="/security" className="text-primary hover:underline">Security page</a> for more details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Contact</h2>
            <p className="leading-relaxed">
              For privacy-related inquiries, contact us at{' '}
              <a href="mailto:shoaibrain@edforge.net" className="text-primary hover:underline">shoaibrain@edforge.net</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

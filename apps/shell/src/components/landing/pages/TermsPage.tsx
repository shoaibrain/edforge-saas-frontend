import { useEffect } from 'react'

export default function TermsPage() {
  useEffect(() => {
    document.title = 'Terms of Service — EdForge'
  }, [])

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-tight">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: February 2026</p>

        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing or using the EdForge platform, you agree to be bound by these Terms of Service.
              If you are using EdForge on behalf of a school or district, you represent that you have the
              authority to bind that organization to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Description of Service</h2>
            <p className="leading-relaxed">
              EdForge provides a cloud-based Education Management Information System (EMIS) for schools.
              The platform includes student information management, academics (enrollment, classrooms, exams,
              and attendance), finance (fee structures, invoicing, and payments), and a staff directory.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">User Responsibilities</h2>
            <ul className="space-y-2">
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Maintain the confidentiality of your account credentials.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Use the platform in compliance with applicable laws, including FERPA and COPPA.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Ensure that student data entered into the platform is accurate and authorized.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Report any security vulnerabilities or unauthorized access promptly.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Data Ownership</h2>
            <p className="leading-relaxed">
              Schools and districts retain full ownership of their data. EdForge processes data solely to
              provide the contracted services. Upon termination, we will provide a complete data export
              and securely delete all stored data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Limitation of Liability</h2>
            <p className="leading-relaxed">
              EdForge provides the platform "as is" and makes no warranties regarding uninterrupted service.
              Our liability is limited to the fees paid for the service during the 12 months preceding any claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Contact</h2>
            <p className="leading-relaxed">
              Questions about these terms? Contact us at{' '}
              <a href="mailto:shoaib@edforge.app" className="text-primary hover:underline">shoaib@edforge.app</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

import { useEffect } from 'react'
import { Shield, Lock, Eye, Server, CheckCircle } from 'lucide-react'

export default function SecurityLandingPage() {
  useEffect(() => {
    document.title = 'Security — EdForge'
  }, [])

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight">Security</h1>
        <p className="text-base text-muted-foreground mb-12 leading-relaxed sm:text-lg">
          Protecting student data is our highest priority. EdForge is built from the ground up with
          security and privacy at its core.
        </p>

        {/* Compliance badges */}
        <div className="mb-12 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgb(var(--state-success-bg)/0.18)] border border-[rgb(var(--state-success-border)/0.35)]">
            <CheckCircle className="h-4 w-4 text-[rgb(var(--state-success-fg))]" />
            <span className="text-sm font-medium text-[rgb(var(--state-success-fg))]">FERPA Compliant</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgb(var(--state-success-bg)/0.18)] border border-[rgb(var(--state-success-border)/0.35)]">
            <CheckCircle className="h-4 w-4 text-[rgb(var(--state-success-fg))]" />
            <span className="text-sm font-medium text-[rgb(var(--state-success-fg))]">COPPA Ready</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgb(var(--state-info-bg)/0.18)] border border-[rgb(var(--state-info-border)/0.35)]">
            <Shield className="h-4 w-4 text-[rgb(var(--state-info-fg))]" />
            <span className="text-sm font-medium text-[rgb(var(--state-info-fg))]">SOC 2 Roadmap</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgb(var(--state-info-bg)/0.18)] border border-[rgb(var(--state-info-border)/0.35)]">
            <CheckCircle className="h-4 w-4 text-[rgb(var(--state-info-fg))]" />
            <span className="text-sm font-medium text-[rgb(var(--state-info-fg))]">GDPR Compatible</span>
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="rounded-lg bg-primary/10 p-3 w-fit mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Encryption</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Database backups
                are encrypted and stored in geographically redundant locations.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="rounded-lg bg-primary/10 p-3 w-fit mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Access Control</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Role-based and attribute-based access controls ensure users only see data they're
                authorized to access. Multi-factor authentication is available for all accounts.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="rounded-lg bg-primary/10 p-3 w-fit mb-4">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Audit Logging</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Every data access and modification is logged with immutable audit trails.
                Administrators can review who accessed what data and when.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="rounded-lg bg-primary/10 p-3 w-fit mb-4">
                <Server className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Infrastructure</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Hosted on AWS with VPC isolation, security groups, and automated patching.
                Regular penetration testing and vulnerability assessments are conducted.
              </p>
            </div>
          </div>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4 sm:text-2xl">Responsible Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you discover a security vulnerability, please report it to{' '}
              <a href="mailto:shoaibrain@edforge.net" className="text-primary hover:underline">
                shoaibrain@edforge.net
              </a>
              . We appreciate responsible disclosure and will respond promptly to all reports.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

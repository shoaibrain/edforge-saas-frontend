import { useEffect } from 'react'
import { Mail, Twitter } from 'lucide-react'

export default function ContactPage() {
  useEffect(() => {
    document.title = 'Contact — EdForge'
  }, [])

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight">Contact Us</h1>
        <p className="text-base text-muted-foreground mb-12 leading-relaxed sm:text-lg">
          Have questions about EdForge? We'd love to hear from you.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Email</h3>
                <a href="mailto:shoaibrain@edforge.net" className="text-muted-foreground hover:text-primary transition-colors">
                  shoaibrain@edforge.net
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Twitter className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Social</h3>
                <a
                  href="https://x.com/edforgedotnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  @edforgedotnet
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">For Schools</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Interested in bringing EdForge to your school? Reach out to us and we'll schedule a
              personalized walkthrough of the platform.
            </p>
            <a
              href="mailto:shoaibrain@edforge.net?subject=EdForge%20Demo%20Request"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Request a Demo
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

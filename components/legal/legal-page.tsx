"use client"

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { LegalPageKey, markLegalPageRead } from '@/lib/legal-read'

type LegalSection = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

type LegalPageProps = {
  legalKey: LegalPageKey
  title: string
  subtitle: string
  effectiveDate: string
  contactEmail: string
  overview: string
  sections: LegalSection[]
  sidebarTitle: string
  sidebarItems: string[]
  backHref?: string
  backLabel?: string
}

export function LegalPage({
  legalKey,
  title,
  subtitle,
  effectiveDate,
  contactEmail,
  overview,
  sections,
  sidebarTitle,
  sidebarItems,
  backHref = '/',
  backLabel = 'Back to home',
}: LegalPageProps) {
  useEffect(() => {
    const checkReadProgress = () => {
      const doc = document.documentElement
      const maxScrollTop = Math.max(doc.scrollHeight - window.innerHeight, 0)
      const scrolledToBottom = window.scrollY >= maxScrollTop - 80

      if (scrolledToBottom) {
        markLegalPageRead(legalKey)
      }
    }

    checkReadProgress()
    window.addEventListener('scroll', checkReadProgress, { passive: true })
    window.addEventListener('resize', checkReadProgress)

    return () => {
      window.removeEventListener('scroll', checkReadProgress)
      window.removeEventListener('resize', checkReadProgress)
    }
  }, [legalKey])

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.55_0.25_280/0.16),transparent_35%),radial-gradient(circle_at_top_right,oklch(0.70_0.20_330/0.14),transparent_30%),linear-gradient(to_bottom,transparent,oklch(0.13_0.01_270))]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-smooth hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur md:inline-flex">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Invyra legal center
          </div>
        </div>

        <section className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-border/60 bg-card/80 p-6 shadow-2xl shadow-primary/10 backdrop-blur sm:p-8">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.24em] text-primary">{effectiveDate}</p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{subtitle}</p>
              <div className="mt-6 rounded-2xl border border-border/60 bg-background/40 p-4 text-sm leading-7 text-muted-foreground sm:p-5">
                {overview}
              </div>
            </div>

            <div className="space-y-4 rounded-[1.75rem] border border-border/60 bg-card/70 p-6 shadow-xl shadow-black/10 backdrop-blur sm:p-8">
              {sections.map((section) => (
                <section key={section.title} className="space-y-3 border-b border-border/50 pb-6 last:border-b-0 last:pb-0">
                  <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{section.title}</h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-muted-foreground sm:text-[15px]">
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets ? (
                    <ul className="space-y-2 pt-1 text-sm leading-7 text-muted-foreground sm:text-[15px]">
                      {section.bullets.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[1.75rem] border border-border/60 bg-card/80 p-6 shadow-2xl shadow-accent/10 backdrop-blur">
              <h2 className="text-lg font-semibold">{sidebarTitle}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                {sidebarItems.map((item) => (
                  <li key={item} className="flex gap-3 rounded-xl border border-border/50 bg-background/30 px-3 py-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[1.75rem] border border-border/60 bg-gradient-to-br from-primary/15 via-accent/10 to-background p-6 shadow-2xl shadow-primary/10 backdrop-blur">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Need help?
              </div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Contact us at{' '}
                <a className="font-medium text-foreground transition-smooth hover:text-primary" href={`mailto:${contactEmail}`}>
                  {contactEmail}
                </a>{' '}
                if you have questions about these terms or this policy.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
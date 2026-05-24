"use client"

import Link from "next/link"
import { ArrowRight, Compass, LogIn, LayoutDashboard, Sparkles, Settings, Users } from "lucide-react"

const steps = [
  {
    icon: Sparkles,
    title: "1. Start on the homepage",
    description:
      "Read the hero, scan the feature cards, and use the landing page sections to understand what Invyra can do.",
    href: "/",
    linkLabel: "Go to home",
  },
  {
    icon: LogIn,
    title: "2. Create your account",
    description:
      "Choose Get Started or Sign In to enter the app. This takes you into the workspace where your events live.",
    href: "/get-started",
    linkLabel: "Open sign up",
  },
  {
    icon: LayoutDashboard,
    title: "3. Use the app navigation",
    description:
      "Use the top navigation to move between Home, Dashboard, Connections, and Settings without losing your place.",
    href: "/home",
    linkLabel: "Open app home",
  },
  {
    icon: Compass,
    title: "4. Build and publish",
    description:
      "Move through Builder, Editor, Guest List, Preview, and Publish to create, refine, and share your event.",
    href: "/editor?prompt=birthday%20theme&demo=1",
    linkLabel: "Open editor demo",
  },
]

const quickLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Connections", href: "/connections", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function TutorialSection() {
  return (
    <section id="tutorial" className="relative py-24 scroll-mt-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.65_0.16_250/0.08),transparent_30%),radial-gradient(circle_at_bottom_right,oklch(0.7_0.18_320/0.08),transparent_28%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-5">
            <Compass className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Guide for new users</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            How to get started with <span className="gradient-text">Invyra</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            If you are visiting for the first time, follow these steps to learn where everything is,
            create your account, and find your way around the app without guessing.
          </p>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Key workflow: <strong className="text-foreground font-medium">Builder → Editor → Guest List → Preview → Publish</strong> — follow this sequence to create, refine, and share your event. The steps below map to this flow so you can see where each action belongs.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
          <div className="grid gap-4 md:grid-cols-2">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className="group rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-smooth hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-smooth group-hover:bg-primary/20">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
                <Link
                  href={step.href}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground transition-smooth hover:text-primary"
                >
                  {step.linkLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>

          <aside className="rounded-[1.75rem] border border-border/60 bg-card/80 p-6 shadow-xl shadow-black/10 backdrop-blur">
            <h3 className="text-lg font-semibold tracking-tight">Best places to start</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              These are the most useful places for new users after the first walkthrough.
            </p>

            <div className="mt-4 p-3 rounded-lg bg-background/20 border border-border/30 text-sm text-muted-foreground">
              <span className="text-sm font-medium text-primary">Workflow:</span>
              <span className="ml-2">Builder → Editor → Guest List → Preview → Publish</span>
              <p className="mt-2 text-xs italic text-muted-foreground">This is for testing purposes.</p>
            </div>

            <div className="mt-6 space-y-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-background/40 px-4 py-3 text-sm transition-smooth hover:border-primary/30 hover:bg-secondary/60"
                >
                  <span className="flex items-center gap-2 font-medium">
                    {link.icon ? <link.icon className="h-4 w-4 text-primary" /> : null}
                    {link.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <p className="text-sm font-medium text-primary">Tip</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                If you ever feel lost, return to Home or use the top navigation bar. It stays visible while you move
                through the site, so you can always get back to the main sections.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
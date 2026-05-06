"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Heart, Briefcase, PartyPopper } from "lucide-react"

const personas = [
  {
    icon: Heart,
    title: "Personal Events",
    description: "Birthdays, anniversaries, and celebrations that deserve a personal touch.",
    cta: "Create Personal Event",
    color: "text-accent",
    bgColor: "bg-accent/10",
    href: "/builder",
  },
  {
    icon: Briefcase,
    title: "Corporate Events",
    description: "Professional conferences, team gatherings, and brand-aligned invitations.",
    cta: "Create Corporate Event",
    color: "text-primary",
    bgColor: "bg-primary/10",
    href: "/builder",
  },
  {
    icon: PartyPopper,
    title: "Social Gatherings",
    description: "Parties, reunions, and community events that bring people together.",
    cta: "Create Social Event",
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
    href: "/builder",
  },
]

export function PersonasSection() {
  return (
    <section id="personas" className="relative py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            Built for Every{" "}
            <span className="gradient-text">Occasion</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Whether you&apos;re planning an intimate gathering or a grand celebration, 
            Eventora adapts to your needs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {personas.map((persona, index) => (
            <PersonaCard key={index} {...persona} />
          ))}
        </div>
      </div>
    </section>
  )
}

function PersonaCard({
  icon: Icon,
  title,
  description,
  cta,
  color,
  bgColor,
  href,
}: {
  icon: React.ElementType
  title: string
  description: string
  cta: string
  color: string
  bgColor: string
  href: string
}) {
  return (
    <div className="group relative bg-card rounded-2xl border border-border/50 p-8 hover:border-primary/30 transition-smooth overflow-hidden">
      {/* Background gradient on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-smooth">
        <div className={`absolute inset-0 ${bgColor} opacity-20`} />
      </div>
      
      <div className="relative space-y-6">
        <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        
        <div>
          <h3 className="text-xl font-medium mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        
        <Button variant="ghost" className="group/btn p-0 h-auto text-sm" asChild>
          <Link href={href}>
            {cta}
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

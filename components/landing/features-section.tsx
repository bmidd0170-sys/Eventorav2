"use client"

import { Sparkles, Palette, Users, Bell, Layers, Zap } from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "AI Co-Creator",
    description: "Design with an intelligent assistant that suggests layouts, colors, and content in real-time.",
  },
  {
    icon: Palette,
    title: "Limitless Customization",
    description: "No templates. Build from modular design blocks that adapt to your unique vision.",
  },
  {
    icon: Users,
    title: "Smart RSVP Management",
    description: "Track responses, manage guest lists, and send automated reminders effortlessly.",
  },
  {
    icon: Bell,
    title: "Event Reminders",
    description: "Automated notifications keep your guests informed and excited about your event.",
  },
  {
    icon: Layers,
    title: "Advanced Editor",
    description: "Full creative control with layers, animations, and a timeline for complex designs.",
  },
  {
    icon: Zap,
    title: "Instant Preview",
    description: "See changes in real-time as you design. What you see is exactly what guests receive.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 overflow-hidden">
      {/* Background accent */}
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[100px]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            Everything You Need to Create{" "}
            <span className="gradient-text">Magic</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Powerful features that make event creation feel effortless, 
            while giving you complete creative control.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  index 
}: { 
  icon: React.ElementType
  title: string
  description: string
  index: number
}) {
  return (
    <div 
      className="group relative bg-card rounded-2xl border border-border/50 p-6 hover:border-primary/30 transition-smooth"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-smooth">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-medium mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
}

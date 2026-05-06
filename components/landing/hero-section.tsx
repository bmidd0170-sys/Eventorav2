"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Calendar, Users } from "lucide-react"

export function HeroSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background gradient orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/30 via-accent/20 to-chart-3/20 blur-[120px] opacity-60" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left column - Text content */}
          <div className={`space-y-8 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">AI-Powered Creation</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-balance">
              Create Invitations That{" "}
              <span className="gradient-text">Feel Alive</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Design stunning event invitations with AI that understands your vision. 
              No templates, just pure creative freedom powered by intelligent suggestions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gradient-primary border-0 text-white group" asChild>
                <Link href="/home">
                  Design Freely
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-border/50 hover:bg-secondary" asChild>
                <Link href="/dashboard">
                  <Calendar className="w-4 h-4 mr-2" />
                  Plan Efficiently
                </Link>
              </Button>
              <Button size="lg" variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
                <Link href="/settings">
                  <Users className="w-4 h-4 mr-2" />
                  Grow Your Brand
                </Link>
              </Button>
            </div>
          </div>

          {/* Right column - Interactive preview */}
          <div className={`relative ${mounted ? 'animate-fade-in animation-delay-200' : 'opacity-0'}`}>
            <div className="relative">
              {/* Main invitation card */}
              <div className="relative bg-card rounded-2xl border border-border/50 p-6 glow">
                <InvitationPreview />
              </div>
              
              {/* Floating AI suggestion */}
              <div className="absolute -left-4 top-1/4 bg-card rounded-xl border border-border/50 p-3 shadow-xl animate-float">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs text-muted-foreground">Try a warmer palette?</span>
                </div>
              </div>

              {/* Floating stats */}
              <div className="absolute -right-4 bottom-1/4 bg-card rounded-xl border border-border/50 p-3 shadow-xl animate-float animation-delay-500">
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-semibold">24</p>
                    <p className="text-xs text-muted-foreground">RSVPs</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-accent" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-500 {
          animation-delay: 500ms;
        }
      `}</style>
    </section>
  )
}

function InvitationPreview() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Preview</span>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-chart-3" />
        </div>
      </div>

      {/* Invitation content */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-secondary to-muted p-8 text-center space-y-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">You are invited to</p>
          <h3 className="text-2xl font-semibold gradient-text">Summer Celebration</h3>
          <p className="text-sm text-muted-foreground mt-4">
            Join us for an evening of joy, music, and unforgettable memories.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div>
              <Calendar className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p>June 15, 2026</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <Users className="w-4 h-4 mx-auto mb-1 text-accent" />
              <p>50 guests</p>
            </div>
          </div>
          <Button size="sm" className="mt-6 gradient-primary border-0 text-white">
            RSVP Now
          </Button>
        </div>
      </div>
    </div>
  )
}

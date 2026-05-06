"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Sparkles } from "lucide-react"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight">Eventora</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
              Features
            </Link>
            <Link href="#personas" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
              Use Cases
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
              Pricing
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/home">Sign In</Link>
            </Button>
            <Button size="sm" className="gradient-primary border-0 text-white" asChild>
              <Link href="/home">Get Started</Link>
            </Button>
          </div>

          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="px-4 py-4 space-y-3">
            <Link href="#features" className="block text-sm text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="#personas" className="block text-sm text-muted-foreground hover:text-foreground">
              Use Cases
            </Link>
            <Link href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <div className="pt-3 flex flex-col gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/home">Sign In</Link>
              </Button>
              <Button size="sm" className="gradient-primary border-0 text-white" asChild>
                <Link href="/home">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

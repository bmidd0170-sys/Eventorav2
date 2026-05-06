"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  ArrowUp, 
  Paperclip, 
  Sparkles,
  Calendar,
  Users,
  PartyPopper,
  Briefcase,
  Heart,
  GraduationCap,
  Baby,
  Cake
} from "lucide-react"

const quickPrompts = [
  { label: "Birthday Party", icon: Cake },
  { label: "Wedding Invitation", icon: Heart },
  { label: "Corporate Event", icon: Briefcase },
  { label: "Baby Shower", icon: Baby },
  { label: "Graduation", icon: GraduationCap },
  { label: "Social Gathering", icon: PartyPopper },
]

const recentProjects = [
  {
    id: "1",
    title: "Summer Garden Party",
    updatedAt: "2 hours ago",
    thumbnail: "gradient-1"
  },
  {
    id: "2",
    title: "Product Launch Event",
    updatedAt: "Yesterday",
    thumbnail: "gradient-2"
  },
  {
    id: "3",
    title: "Annual Team Celebration",
    updatedAt: "3 days ago",
    thumbnail: "gradient-3"
  },
]

export default function HomePage() {
  const [inputValue, setInputValue] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      router.push(`/editor?prompt=${encodeURIComponent(inputValue.trim())}`)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    router.push(`/editor?prompt=${encodeURIComponent(prompt)}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Main content - vertically centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">
          {/* Greeting */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              What event would you like to create?
            </h1>
            <p className="text-muted-foreground">
              Describe your vision and let AI bring it to life.
            </p>
          </div>

          {/* Prompt input area */}
          <form onSubmit={handleSubmit}>
            <div 
              className={`relative bg-card rounded-2xl border transition-all duration-200 ${
                isFocused 
                  ? "border-primary/50 shadow-lg shadow-primary/5" 
                  : "border-border/50"
              }`}
            >
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Create an elegant wedding invitation with floral accents and RSVP page..."
                rows={3}
                className="w-full bg-transparent px-4 pt-4 pb-14 text-base resize-none focus:outline-none placeholder:text-muted-foreground/60"
              />
              
              {/* Input actions */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Attach inspiration images
                  </span>
                </div>
                
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!inputValue.trim()}
                  className={`h-8 w-8 rounded-lg transition-all ${
                    inputValue.trim() 
                      ? "gradient-primary border-0 text-white" 
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </form>

          {/* Quick prompts */}
          <div className="flex flex-wrap justify-center gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt.label}
                onClick={() => handleQuickPrompt(prompt.label)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 hover:bg-secondary text-sm text-muted-foreground hover:text-foreground transition-smooth"
              >
                <prompt.icon className="w-4 h-4" />
                {prompt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent projects - bottom section */}
      <div className="border-t border-border/50 bg-card/30 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Recent Projects</span>
            <Link href="/dashboard" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recentProjects.map((project) => (
              <Link 
                key={project.id} 
                href={`/editor?project=${project.id}`}
                className="group"
              >
                <div className="bg-card rounded-xl border border-border/50 overflow-hidden hover:border-primary/30 transition-smooth">
                  {/* Thumbnail */}
                  <div className={`h-24 ${
                    project.thumbnail === "gradient-1" 
                      ? "bg-gradient-to-br from-primary/30 to-accent/20"
                      : project.thumbnail === "gradient-2"
                        ? "bg-gradient-to-br from-accent/30 to-chart-3/20"
                        : "bg-gradient-to-br from-chart-3/30 to-primary/20"
                  }`}>
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-16 h-20 bg-card/80 rounded-lg shadow-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-3">
                    <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {project.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {project.updatedAt}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

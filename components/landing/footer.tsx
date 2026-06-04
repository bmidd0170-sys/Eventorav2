import Link from "next/link"
import { Sparkles } from "lucide-react"

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Builder", href: "/builder" },
    { label: "Editor", href: "/editor" },
    { label: "Pricing", href: "#pricing" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "Templates", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Support", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Press", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Cookies", href: "#" },
  ],
}

export function Footer() {
  return (
    <footer className="relative border-t border-border/50 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-semibold tracking-tight">Invyra</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              AI-powered event invitations that bring your celebrations to life.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-medium mb-4 text-sm">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href === '/privacy' || link.href === '/terms' ? { pathname: link.href, query: { returnTo: '/' } } : link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {new Date().getFullYear()} Invyra. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-smooth">
              Twitter
            </Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-smooth">
              LinkedIn
            </Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-smooth">
              Instagram
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

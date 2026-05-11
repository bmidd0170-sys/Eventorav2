"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Mail, ArrowLeft, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/sign-in" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>

        <div className="rounded-3xl border border-border/50 bg-card p-8 shadow-2xl shadow-black/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Reset your password</h1>
              <p className="text-sm text-muted-foreground">We’ll send a reset link to your email.</p>
            </div>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
              <p className="font-medium">Check your inbox</p>
              <p className="text-sm text-muted-foreground">
                If an account exists for {email || "that email"}, you’ll receive a reset link shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="pl-10 h-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 gradient-primary border-0 text-white">
                Send reset link
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

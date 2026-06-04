"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, User, Check } from "lucide-react"
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/auth/client'
import { saveCurrentUserProfile } from '@/lib/profile'
import { requestGoogleAccessToken } from '@/lib/auth/client'
import { hasReadAllLegalPages, subscribeLegalReadChanges } from '@/lib/legal-read'
import { useErrorPopup } from '@/components/providers/error-popup-provider'

export default function GetStartedPage() {
  const router = useRouter()
  const { showError } = useErrorPopup()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"signup" | "details">("signup")
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    agreeToTerms: false,
    receiveUpdates: true,
  })
  const canContinue = hasReadAllLegalPages()

  useEffect(() => {
    setFormData((current) => (current.agreeToTerms === canContinue ? current : { ...current, agreeToTerms: canContinue }))

    return subscribeLegalReadChanges(() => {
      const allowed = hasReadAllLegalPages()
      setFormData((current) => (current.agreeToTerms === allowed ? current : { ...current, agreeToTerms: allowed }))
    })
  }, [canContinue])

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/home')
      }
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step === "signup") {
      if (!canContinue) {
        showError({
          title: "Legal agreement required",
          message: "Please review and agree to the Terms of Service and Privacy Policy before continuing.",
          severity: "info",
        })
        return
      }

      setStep("details")
      return
    }

    if (!canContinue) {
      showError({
        title: "Legal agreement required",
        message: "Please review and agree to the Terms of Service and Privacy Policy before creating your account.",
        severity: "info",
      })
      return
    }

    setIsLoading(true)
    try {
      await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      await saveCurrentUserProfile({ displayName: formData.name })
      router.push('/home')
    } catch (err: any) {
      showError({
        title: "Could not create account",
        message: err?.message || 'Please check your details and try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    if (!canContinue) {
      showError({
        title: "Legal agreement required",
        message: "Please review and agree to the Terms of Service and Privacy Policy before continuing with Google.",
        severity: "info",
      })
      return
    }

    try {
      const accessToken = await requestGoogleAccessToken()
      const credential = GoogleAuthProvider.credential(undefined, accessToken)
      const userCredential = await signInWithCredential(auth, credential)
      await saveCurrentUserProfile({
        displayName: userCredential.user.displayName || userCredential.user.email?.split("@")[0] || null,
        photoUrl: userCredential.user.photoURL || null,
      })
      router.replace('/home')
    } catch (err: any) {
      showError({
        title: "Google sign-up failed",
        message: err?.message || 'Please try again or continue with email and password.',
        severity: "warning",
      })
    }
  }

  const passwordStrength = () => {
    const { password } = formData
    if (password.length === 0) return { level: 0, text: "" }
    if (password.length < 6) return { level: 1, text: "Weak" }
    if (password.length < 10) return { level: 2, text: "Medium" }
    if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { level: 3, text: "Strong" }
    }
    return { level: 2, text: "Medium" }
  }

  const strength = passwordStrength()

  const features = [
    "AI-powered invitation design",
    "Multi-page event experiences",
    "Real-time RSVP tracking",
    "Beautiful templates to start from",
  ]

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-semibold">Invyra</span>
          </Link>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">
              {step === "signup" ? "Create your account" : "Tell us about yourself"}
            </h2>
            <p className="text-muted-foreground">
              {step === "signup" ? (
                <>
                  Already have an account?{" "}
                  <Link href="/sign-in" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </>
              ) : (
                "Help us personalize your experience"
              )}
            </p>
          </div>

          {step === "signup" ? (
            <p className="mb-6 text-sm leading-6 text-muted-foreground">
              Read the Terms of Service and Privacy Policy to unlock sign up.
            </p>
          ) : null}

          {step === "signup" ? (
            <>
              {/* Social sign up */}
              <div className="space-y-3 mb-6">
                <Button
                  variant="outline"
                  className="w-full h-12 text-base"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={!canContinue}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-background text-muted-foreground">or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10 h-12"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 h-12"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      className="pl-10 pr-10 h-12"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {formData.password.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-colors ${level <= strength.level
                              ? strength.level === 1
                                ? "bg-red-500"
                                : strength.level === 2
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              : "bg-muted"
                              }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${strength.level === 1
                        ? "text-red-500"
                        : strength.level === 2
                          ? "text-yellow-500"
                          : "text-green-500"
                        }`}>
                        {strength.text}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={canContinue}
                      onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
                      disabled={!canContinue}
                      className="mt-0.5"
                    />
                    <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-tight">
                      I agree to the{" "}
                      <Link href={{ pathname: '/terms', query: { returnTo: '/get-started' } }} className="text-primary hover:underline">Terms of Service</Link>
                      {" "}and{" "}
                      <Link href={{ pathname: '/privacy', query: { returnTo: '/get-started' } }} className="text-primary hover:underline">Privacy Policy</Link>
                    </Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="updates"
                      checked={formData.receiveUpdates}
                      onCheckedChange={(checked) => setFormData({ ...formData, receiveUpdates: checked as boolean })}
                      className="mt-0.5"
                    />
                    <Label htmlFor="updates" className="text-sm font-normal cursor-pointer leading-tight">
                      Send me product updates and tips (optional)
                    </Label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base gradient-primary border-0 text-white"
                  disabled={!canContinue}
                >
                  <span className="flex items-center gap-2">
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </Button>
              </form>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  What best describes you?
                </p>

                {[
                  { id: "personal", label: "Personal use", desc: "Planning my own events" },
                  { id: "business", label: "Small Business", desc: "Creating events for clients" },
                  { id: "agency", label: "Agencies/Team", desc: "Managing multiple brands" },
                  { id: "other", label: "Just exploring", desc: "Checking out what Invyra can do" },
                ].map((option) => {
                  const isSelected = selectedOption === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedOption(option.id)}
                      className={`w-full p-4 rounded-xl border transition-all text-left group ${isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-medium transition-colors ${isSelected ? "text-primary" : "group-hover:text-primary"}`}>{option.label}</p>
                          <p className="text-sm text-muted-foreground">{option.desc}</p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base gradient-primary border-0 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating your account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Get started
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setStep("signup")}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Go back
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Right side - Features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-bl from-background via-transparent to-background" />

        {/* Floating elements */}
        <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-3xl gradient-primary opacity-30 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 left-1/4 w-56 h-56 rounded-full bg-accent/30 blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
            Start creating<br />
            <span className="gradient-text">unforgettable events</span>
          </h1>

          <p className="text-muted-foreground text-lg mb-10 max-w-md">
            Join thousands of creators who use Invyra to design beautiful, personalized invitations.
          </p>

          {/* Features list */}
          <div className="space-y-4 max-w-md">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mt-12 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 max-w-sm">
            <p className="text-sm mb-4 leading-relaxed">
              &quot;Invyra made planning my wedding invitations so easy. The AI suggestions were spot-on and saved me hours of design work.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-primary" />
              <div>
                <p className="font-medium text-sm">Emily Chen</p>
                <p className="text-xs text-muted-foreground">Bride-to-be</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

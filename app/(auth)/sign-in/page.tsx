"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { requestGoogleAccessToken } from '@/lib/google-auth'
import { getFriendlyErrorMessage } from '@/lib/error-utils'

export default function SignInPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        window.location.replace('/home')
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password)
      window.location.replace('/home')
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err, 'We could not sign you in right now.')
      alert(msg)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    try {
      const accessToken = await requestGoogleAccessToken()
      const credential = GoogleAuthProvider.credential(undefined, accessToken)
      await signInWithCredential(auth, credential)
      window.location.replace('/home')
    } catch (err: any) {
      alert(err?.message || 'Google sign-in failed')
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-background" />

        {/* Floating elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-3xl gradient-primary opacity-30 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-accent/30 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <Link href="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-semibold font-sans">Invyra</span>
          </Link>

          <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
            Welcome back to<br />
            <span className="gradient-text">creative invitations</span>
          </h1>

          <p className="text-muted-foreground text-lg max-w-md">
            Continue crafting beautiful event experiences with AI-powered design tools.
          </p>

          {/* Preview card */}
          <div className="mt-12 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full gradient-primary" />
              <div>
                <p className="font-medium text-sm">Sarah&apos;s Wedding</p>
                <p className="text-xs text-muted-foreground">Last edited 2 hours ago</p>
              </div>
            </div>
            <div className="h-32 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Your designs await</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-semibold">Invyra</span>
          </Link>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Sign in to your account</h2>
            <p className="text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/get-started" className="text-primary hover:underline">
                Get started
              </Link>
            </p>
          </div>

          {/* Social sign in */}
          <div className="space-y-3 mb-6">
            <Button
              variant="outline"
              className="w-full h-12 text-base"
              type="button"
              onClick={handleGoogleSignIn}
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
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="pl-10 h-12"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
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
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="h-4 w-4 rounded border border-input bg-background"
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Remember me for 30 days
              </Label>
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
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            By signing in, you agree to our{" "}
            <Link href={{ pathname: '/terms', query: { returnTo: '/sign-in' } }} className="text-primary hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href={{ pathname: '/privacy', query: { returnTo: '/sign-in' } }} className="text-primary hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

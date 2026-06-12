"use client"

import React, { useEffect, useRef, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserBranding, saveUserBranding, type BrandSettings } from '@/lib/branding'
import { fetchWithAuth } from '@/lib/api-client'

export type PersonalityContext = {
  toneTemplate?: string
  tone?: string
  exampleSentences?: string[]
  personalityQuestionnaireAnswers?: Record<string, unknown>
  emailSignature?: string
}

type BrandContextValue = {
  brand: BrandSettings | null
  personality: PersonalityContext | null
  setBrand: (b: BrandSettings) => Promise<void>
  setPersonality: (p: PersonalityContext) => Promise<void>
}

export const BrandContext = React.createContext<BrandContextValue | undefined>(undefined)

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrandState] = useState<BrandSettings | null>(null)
  const [personality, setPersonalityState] = useState<PersonalityContext | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const activeLoadIdRef = useRef(0)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const nextLoadId = Date.now()
      activeLoadIdRef.current = nextLoadId

      if (user) {
        setUserId(user.uid)
        void loadBrand(user.uid, nextLoadId)
        void loadPersonality(user.uid, nextLoadId)
      } else {
        setUserId(null)
        setBrandState(null)
        setPersonalityState(null)
      }
    })
    return () => unsub()
  }, [])

  async function loadBrand(uid: string, loadId: number) {
    try {
      const data = await getUserBranding(uid)
      if (loadId !== activeLoadIdRef.current) return
      setBrandState(data)
    } catch (e) {
      if (loadId !== activeLoadIdRef.current) return
      console.error('Failed to load brand', e)
      setBrandState({})
    }
  }

  async function loadPersonality(uid: string, loadId: number) {
    try {
      const response = await fetchWithAuth("/api/brand-settings", { method: "GET" })
      if (!response.ok) {
        setPersonalityState(null)
        return
      }
      
      if (loadId !== activeLoadIdRef.current) return
      
      const data = await response.json()
      const settings = data.settings
      
      setPersonalityState({
        toneTemplate: settings.toneTemplate || undefined,
        tone: settings.tone || undefined,
        exampleSentences: settings.exampleSentences,
        personalityQuestionnaireAnswers: settings.personalityQuestionnaireAnswers,
        emailSignature: settings.emailSignature || undefined,
      })
    } catch (e) {
      if (loadId !== activeLoadIdRef.current) return
      console.warn('Failed to load personality settings', e)
      setPersonalityState(null)
    }
  }

  useEffect(() => {
    const root = document.documentElement
    const applyVar = (name: string, value: string | undefined) => {
      if (value) {
        root.style.setProperty(name, value)
      } else {
        root.style.removeProperty(name)
      }
    }

    applyVar('--brand-primary', brand?.primaryColor)
    applyVar('--brand-heading-color', brand?.primaryColor)
    applyVar('--brand-secondary', brand?.secondaryColor)
    applyVar('--brand-accent', brand?.accentColor)
    applyVar('--brand-font-heading', brand?.headingFont)
    applyVar('--brand-font-body', brand?.bodyFont)
  }, [brand])

  const setBrand = async (b: BrandSettings) => {
    const resolvedUserId = userId || auth.currentUser?.uid
    if (!resolvedUserId) throw new Error('Not signed in')

    const previous = brand ?? {}
    const next = { ...previous, ...b }

    setBrandState(next)

    await saveUserBranding(resolvedUserId, next)
    if (!userId) {
      setUserId(resolvedUserId)
    }
  }

  const setPersonality = async (p: PersonalityContext) => {
    const resolvedUserId = userId || auth.currentUser?.uid
    if (!resolvedUserId) throw new Error('Not signed in')

    const previous = personality ?? {}
    const next = { ...previous, ...p }

    setPersonalityState(next)

    try {
      await fetchWithAuth("/api/brand-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      })
    } catch (error) {
      console.error("Failed to save personality settings", error)
      throw error
    }

    if (!userId) {
      setUserId(resolvedUserId)
    }
  }

  return (
    <BrandContext.Provider value={{ brand, personality, setBrand, setPersonality }}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand() {
  const ctx = React.useContext(BrandContext)
  if (!ctx) throw new Error('useBrand must be used within BrandProvider')
  return ctx
}

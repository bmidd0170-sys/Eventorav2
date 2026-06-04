"use client"

import React, { useEffect, useRef, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserBranding, saveUserBranding, type BrandSettings } from '@/lib/branding'

type BrandContextValue = {
  brand: BrandSettings | null
  setBrand: (b: BrandSettings) => Promise<void>
}

export const BrandContext = React.createContext<BrandContextValue | undefined>(undefined)

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrandState] = useState<BrandSettings | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const activeLoadIdRef = useRef(0)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const nextLoadId = Date.now()
      activeLoadIdRef.current = nextLoadId

      if (user) {
        setUserId(user.uid)
        void loadBrand(user.uid, nextLoadId)
      } else {
        setUserId(null)
        setBrandState(null)
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

  return (
    <BrandContext.Provider value={{ brand, setBrand }}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand() {
  const ctx = React.useContext(BrandContext)
  if (!ctx) throw new Error('useBrand must be used within BrandProvider')
  return ctx
}

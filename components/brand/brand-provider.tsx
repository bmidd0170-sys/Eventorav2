"use client"

import React, { useEffect, useState } from 'react'
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

  useEffect(() => {
    const initialUser = auth.currentUser
    if (initialUser) {
      setUserId(initialUser.uid)
      loadBrand(initialUser.uid)
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
        loadBrand(user.uid)
      } else {
        setUserId(null)
        setBrandState(null)
      }
    })
    return () => unsub()
  }, [])

  async function loadBrand(uid: string) {
    try {
      const data = await getUserBranding(uid)
      setBrandState(data)
    } catch (e) {
      console.error('Failed to load brand', e)
      setBrandState({})
    }
  }

  useEffect(() => {
    if (!brand) return
    // Apply CSS variables
    if (brand.primaryColor) {
      document.documentElement.style.setProperty('--brand-primary', brand.primaryColor)
      document.documentElement.style.setProperty('--brand-heading-color', brand.primaryColor)
    }
    if (brand.secondaryColor) document.documentElement.style.setProperty('--brand-secondary', brand.secondaryColor)
    if (brand.accentColor) document.documentElement.style.setProperty('--brand-accent', brand.accentColor)
    if (brand.headingFont) document.documentElement.style.setProperty('--brand-font-heading', brand.headingFont)
    if (brand.bodyFont) document.documentElement.style.setProperty('--brand-font-body', brand.bodyFont)
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

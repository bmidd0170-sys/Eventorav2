export type BrandSettings = {
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  headingFont?: string
  bodyFont?: string
  defaultHeadline?: string
  defaultSubheadline?: string
  defaultCtaLabel?: string
  logoDataUrl?: string
}

export type InvitationPage = {
  id: string
  name: string
  icon: any
  content: {
    headline?: string
    subheadline?: string
    body?: string
    date?: string
    time?: string
    location?: string
    buttons?: { label: string; action: string }[]
    fields?: { label: string; type: string; required: boolean }[]
    items?: any[]
    images?: string[]
    questions?: { question: string; answer: string }[]
    elements?: any[]
  }
}

export async function getUserBranding(userId: string): Promise<BrandSettings> {
  try {
    if (typeof window === 'undefined') return {}

    const raw = localStorage.getItem(`invyra:brand-settings:${userId}`)
    if (!raw) return {}

    return JSON.parse(raw) as BrandSettings
  } catch (err) {
    console.warn('Failed to load branding settings', err)
    return {}
  }
}

export async function saveUserBranding(userId: string, settings: Partial<BrandSettings>) {
  try {
    if (typeof window === 'undefined') return

    const key = `invyra:brand-settings:${userId}`
    const existing = await getUserBranding(userId)
    const next = {
      ...existing,
      ...settings,
    }

    localStorage.setItem(key, JSON.stringify(next))
  } catch (err) {
    console.error('Failed to save branding settings', err)
    throw err
  }
}

/**
 * Apply brand settings to invitation pages to theme them with the user's brand kit
 */
export function applyBrandSettingsToPages(pages: InvitationPage[], brand: BrandSettings): InvitationPage[] {
  if (!pages || Object.keys(brand).length === 0) {
    return pages
  }

  return pages.map((page) => ({
    ...page,
    content: {
      ...page.content,
      // Apply brand default headline if generic
      headline:
        page.content.headline === "You're Invited" && brand.defaultHeadline
          ? brand.defaultHeadline
          : page.content.headline,
      // Apply brand default subheadline if generic
      subheadline:
        page.content.subheadline === "Join us for a celebration" && brand.defaultSubheadline
          ? brand.defaultSubheadline
          : page.content.subheadline,
      // Apply brand default CTA labels to buttons
      buttons: page.content.buttons?.map((btn) => ({
        ...btn,
        label:
          (btn.label === "Submit RSVP" || btn.label === "Confirm Attendance" || btn.label === "Save My Spot" || btn.label === "Register") && brand.defaultCtaLabel
            ? brand.defaultCtaLabel
            : btn.label,
      })),
      // Apply brand settings to fields (update placeholder/label styling)
      fields: page.content.fields?.map((field) => ({
        ...field,
        // Keep field structure but can apply brand styling
      })),
    },
  }))
}

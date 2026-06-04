type LegalBackTarget = {
  href: '/' | '/sign-in' | '/get-started'
  label: string
}

const legalBackTargets: Record<LegalBackTarget['href'], LegalBackTarget> = {
  '/': { href: '/', label: 'Back to home' },
  '/sign-in': { href: '/sign-in', label: 'Back to sign in' },
  '/get-started': { href: '/get-started', label: 'Back to get started' },
}

export function getLegalBackTarget(returnTo: string | string[] | undefined): LegalBackTarget {
  const candidate = Array.isArray(returnTo) ? returnTo[0] : returnTo

  if (candidate && candidate in legalBackTargets) {
    return legalBackTargets[candidate as LegalBackTarget['href']]
  }

  return legalBackTargets['/']
}
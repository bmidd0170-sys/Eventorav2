const LEGAL_READ_EVENT = 'invyra-legal-read-changed'

export type LegalPageKey = 'terms' | 'privacy'

const LEGAL_STORAGE_KEYS: Record<LegalPageKey, string> = {
  terms: 'invyra:legal-read:terms',
  privacy: 'invyra:legal-read:privacy',
}

function isBrowser() {
  return typeof window !== 'undefined'
}

export function markLegalPageRead(pageKey: LegalPageKey) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(LEGAL_STORAGE_KEYS[pageKey], 'true')
  window.dispatchEvent(new Event(LEGAL_READ_EVENT))
}

export function hasReadLegalPage(pageKey: LegalPageKey) {
  if (!isBrowser()) {
    return false
  }

  return window.localStorage.getItem(LEGAL_STORAGE_KEYS[pageKey]) === 'true'
}

export function hasReadAllLegalPages() {
  return hasReadLegalPage('terms') && hasReadLegalPage('privacy')
}

export function subscribeLegalReadChanges(onChange: () => void) {
  if (!isBrowser()) {
    return () => {}
  }

  const handleStorage = (event: StorageEvent) => {
    if (Object.values(LEGAL_STORAGE_KEYS).includes(event.key ?? '')) {
      onChange()
    }
  }

  window.addEventListener('storage', handleStorage)
  window.addEventListener(LEGAL_READ_EVENT, onChange)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(LEGAL_READ_EVENT, onChange)
  }
}
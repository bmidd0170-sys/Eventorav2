const GOOGLE_OAUTH_CLIENT_ID = '1048917315656-f31pbntlfcq7j1fdepnvq03pg63a8s86.apps.googleusercontent.com'
const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

type GoogleTokenResponse = {
  access_token?: string
  error?: string
  error_description?: string
}

function loadGoogleIdentityScript() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google sign-in is only available in the browser'))
      return
    }

    const existingGoogle = (window as any).google
    if (existingGoogle?.accounts?.oauth2?.initTokenClient) {
      resolve()
      return
    }

    const existingScript = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`)
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google sign-in')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google sign-in'))
    document.head.appendChild(script)
  })
}

export async function requestGoogleAccessToken() {
  await loadGoogleIdentityScript()

  const google = (window as any).google
  const oauth2 = google?.accounts?.oauth2

  if (!oauth2?.initTokenClient) {
    throw new Error('Google sign-in is unavailable in this browser')
  }

  return await new Promise<string>((resolve, reject) => {
    const tokenClient = oauth2.initTokenClient({
      client_id: GOOGLE_OAUTH_CLIENT_ID,
      scope: 'openid email profile',
      callback: (response: GoogleTokenResponse) => {
        if (response?.error || !response?.access_token) {
          reject(new Error(response?.error_description || response?.error || 'Google sign-in failed'))
          return
        }

        resolve(response.access_token)
      },
    })

    tokenClient.requestAccessToken({ prompt: 'consent' })
  })
}
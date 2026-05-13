import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export type NotificationSettings = {
  emailRsvp: boolean
  emailReminders: boolean
  emailSecurity: boolean
  emailMarketing: boolean
  emailConnectionsRequests: boolean
  emailConnectionsAccepted: boolean
  pushRsvp: boolean
  pushReminders: boolean
  pushTips: boolean
  pushConnectionsRequests: boolean
  pushConnectionsAccepted: boolean
}

export const defaultNotificationSettings: NotificationSettings = {
  emailRsvp: true,
  emailReminders: true,
  emailSecurity: true,
  emailMarketing: false,
  emailConnectionsRequests: true,
  emailConnectionsAccepted: true,
  pushRsvp: true,
  pushReminders: true,
  pushTips: false,
  pushConnectionsRequests: true,
  pushConnectionsAccepted: true,
}

export async function getUserNotificationSettings(userId: string): Promise<NotificationSettings> {
  try {
    const ref = doc(db, 'userSettings', userId)
    const snap = await getDoc(ref)
    if (!snap.exists()) return defaultNotificationSettings
    return { ...defaultNotificationSettings, ...(snap.data() as Partial<NotificationSettings>) }
  } catch (err) {
    console.warn('Failed to load notification settings, using defaults', err)
    return defaultNotificationSettings
  }
}

export async function saveUserNotificationSettings(userId: string, settings: Partial<NotificationSettings>) {
  try {
    const ref = doc(db, 'userSettings', userId)
    await setDoc(ref, settings, { merge: true })
  } catch (err) {
    console.error('Failed to save user notification settings', err)
    throw err
  }
}

export async function sendEmailIfAllowed(userId: string, settingKey: keyof NotificationSettings, mail: { to: string; subject: string; text?: string; html?: string }) {
  const settings = await getUserNotificationSettings(userId)
  if (!settings[settingKey]) return false

  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: mail.to, subject: mail.subject, text: mail.text, html: mail.html }),
    })
    return true
  } catch (err) {
    console.warn('Failed to send email via API', err)
    return false
  }
}

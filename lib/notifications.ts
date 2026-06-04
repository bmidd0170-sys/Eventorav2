import { fetchWithAuth } from "@/lib/api-client"
import { defaultNotificationSettings, type NotificationSettings } from "@/lib/notification-settings"
import { getFriendlyResponseMessage } from "@/lib/error-utils"

export async function getUserNotificationSettings(userId: string): Promise<NotificationSettings> {
  try {
    const response = await fetchWithAuth("/api/notification-settings")
    if (!response.ok) {
      return defaultNotificationSettings
    }

    const data = (await response.json()) as { settings: NotificationSettings }
    return { ...defaultNotificationSettings, ...data.settings }
  } catch (err) {
    console.warn('Failed to load notification settings', err)
    return defaultNotificationSettings
  }
}

export async function saveUserNotificationSettings(userId: string, settings: Partial<NotificationSettings>) {
  try {
    const response = await fetchWithAuth("/api/notification-settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    })

    if (!response.ok) {
      throw new Error(await getFriendlyResponseMessage(response, "We couldn't save your notification settings right now."))
    }
  } catch (err) {
    console.error('Failed to save user notification settings', err)
    throw err
  }
}

export async function sendEmailIfAllowed(userId: string, settingKey: keyof NotificationSettings, mail: { to: string; subject: string; text?: string; html?: string; fromName?: string }) {
  let settings = defaultNotificationSettings
  try {
    settings = await getUserNotificationSettings(userId)
  } catch (err) {
    console.warn('Falling back to default notification settings for email send', err)
  }
  if (!settings[settingKey]) return false

  try {
    await fetchWithAuth('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: mail.to, subject: mail.subject, text: mail.text, html: mail.html, fromName: mail.fromName }),
    })
    return true
  } catch (err) {
    console.warn('Failed to send email via API', err)
    return false
  }
}

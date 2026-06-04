export type NotificationSettings = {
  emailRsvp: boolean
  emailReminders: boolean
  emailSecurity: boolean
  emailMarketing: boolean
  emailConnectionsRequests: boolean
  emailConnectionsAccepted: boolean
  emailTutorialComplete: boolean
  emailAppUpdates: boolean
  emailEventCancelled: boolean
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
  emailTutorialComplete: true,
  emailAppUpdates: true,
  emailEventCancelled: true,
  pushRsvp: true,
  pushReminders: true,
  pushTips: false,
  pushConnectionsRequests: true,
  pushConnectionsAccepted: true,
}
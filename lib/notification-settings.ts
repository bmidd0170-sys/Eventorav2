export type NotificationSettings = {
  emailWelcome: boolean
  emailTutorialComplete: boolean
  emailRsvp: boolean
  emailReminders: boolean
  emailSecurity: boolean
  emailMarketing: boolean
  emailConnectionsOutgoing: boolean
  emailConnectionsIncoming: boolean
  emailConnectionsAccepted: boolean
  emailEventCancelled: boolean
  emailAppUpdates: boolean
  pushRsvp: boolean
  pushReminders: boolean
  pushTips: boolean
  pushConnectionsRequests: boolean
  pushConnectionsAccepted: boolean
}

export const defaultNotificationSettings: NotificationSettings = {
  emailWelcome: true,
  emailTutorialComplete: true,
  emailRsvp: true,
  emailReminders: true,
  emailSecurity: true,
  emailMarketing: false,
  emailConnectionsOutgoing: true,
  emailConnectionsIncoming: true,
  emailConnectionsAccepted: true,
  emailEventCancelled: true,
  emailAppUpdates: true,
  pushRsvp: true,
  pushReminders: true,
  pushTips: false,
  pushConnectionsRequests: true,
  pushConnectionsAccepted: true,
}
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
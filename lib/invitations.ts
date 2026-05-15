export type InvitationSummary = {
  id: string
  title: string
  description?: string
  date: string
  time: string
  color?: string
  status: "active" | "draft"
  guests: {
    confirmed: number
    total: number
  }
  reminder?: boolean
  updatedAt?: string
}

export const invitations: InvitationSummary[] = [
  {
    id: "evt-1",
    title: "Launch Party",
    description: "Celebrate the product launch with the team.",
    date: "May 20",
    time: "7:00 PM",
    color: "from-accent/30 via-accent/10 to-transparent",
    status: "active",
    guests: { confirmed: 120, total: 200 },
    reminder: true,
  },
  {
    id: "evt-2",
    title: "Team Offsite",
    description: "Quarterly team offsite and planning.",
    date: "Jun 5",
    time: "9:00 AM",
    color: "from-primary/30 via-primary/10 to-transparent",
    status: "draft",
    guests: { confirmed: 32, total: 50 },
    reminder: false,
  },
  {
    id: "evt-3",
    title: "Customer Meetup",
    description: "Local customer meetup and feedback session.",
    date: "Jul 12",
    time: "6:30 PM",
    color: "from-chart-3/30 via-chart-3/10 to-transparent",
    status: "active",
    guests: { confirmed: 48, total: 80 },
    reminder: true,
  },
]

export const defaultInvitationId = invitations[0]?.id ?? "evt-1"

export function getInvitationById(id?: string): InvitationSummary {
  if (!id) return invitations[0]
  return invitations.find(inv => inv.id === id) ?? invitations[0]
}

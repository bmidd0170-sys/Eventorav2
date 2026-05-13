export type Guest = {
    id: string
    name: string
    email: string
    phone?: string
    status: "confirmed" | "pending" | "declined"
    plusOne: boolean
    dietaryNotes?: string
    respondedAt?: string
}

export const guestLists: Record<string, Guest[]> = {
    "evt-1": [
        { id: "1", name: "Emma Thompson", email: "emma@example.com", phone: "+1 555-0101", status: "confirmed", plusOne: true, respondedAt: "2 days ago" },
        { id: "2", name: "James Wilson", email: "james@example.com", phone: "+1 555-0102", status: "confirmed", plusOne: false, dietaryNotes: "Vegetarian", respondedAt: "3 days ago" },
        { id: "3", name: "Sarah Chen", email: "sarah@example.com", status: "pending", plusOne: true },
        { id: "4", name: "Michael Brown", email: "michael@example.com", phone: "+1 555-0104", status: "confirmed", plusOne: true, respondedAt: "1 day ago" },
        { id: "5", name: "Lisa Anderson", email: "lisa@example.com", status: "declined", plusOne: false, respondedAt: "4 days ago" },
        { id: "6", name: "David Kim", email: "david@example.com", phone: "+1 555-0106", status: "pending", plusOne: false },
        { id: "7", name: "Jennifer Martinez", email: "jennifer@example.com", status: "confirmed", plusOne: true, dietaryNotes: "Gluten-free", respondedAt: "5 days ago" },
        { id: "8", name: "Robert Taylor", email: "robert@example.com", phone: "+1 555-0108", status: "pending", plusOne: true },
        { id: "9", name: "Amanda White", email: "amanda@example.com", status: "confirmed", plusOne: false, respondedAt: "1 day ago" },
        { id: "10", name: "Christopher Lee", email: "chris@example.com", phone: "+1 555-0110", status: "confirmed", plusOne: true, respondedAt: "6 days ago" },
    ],
    "evt-2": [
        { id: "11", name: "Olivia Parker", email: "olivia@example.com", phone: "+1 555-0201", status: "confirmed", plusOne: true, respondedAt: "1 day ago" },
        { id: "12", name: "Noah Johnson", email: "noah@example.com", status: "confirmed", plusOne: false, respondedAt: "2 days ago" },
        { id: "13", name: "Ava Martinez", email: "ava@example.com", phone: "+1 555-0203", status: "pending", plusOne: true },
        { id: "14", name: "Mason Lee", email: "mason@example.com", status: "confirmed", plusOne: false, dietaryNotes: "No shellfish", respondedAt: "4 days ago" },
        { id: "15", name: "Sophia Turner", email: "sophia@example.com", status: "declined", plusOne: false, respondedAt: "5 days ago" },
        { id: "16", name: "Ethan Brooks", email: "ethan@example.com", phone: "+1 555-0206", status: "pending", plusOne: true },
        { id: "17", name: "Mia Foster", email: "mia@example.com", status: "confirmed", plusOne: true, dietaryNotes: "Vegetarian", respondedAt: "3 days ago" },
        { id: "18", name: "Lucas Reed", email: "lucas@example.com", phone: "+1 555-0208", status: "pending", plusOne: false },
    ],
    "evt-3": [
        { id: "19", name: "Grace Hall", email: "grace@example.com", phone: "+1 555-0301", status: "confirmed", plusOne: true, respondedAt: "2 days ago" },
        { id: "20", name: "Benjamin Young", email: "ben@example.com", status: "confirmed", plusOne: false, respondedAt: "1 day ago" },
        { id: "21", name: "Chloe Adams", email: "chloe@example.com", phone: "+1 555-0303", status: "pending", plusOne: true },
        { id: "22", name: "Daniel Scott", email: "daniel@example.com", status: "confirmed", plusOne: false, dietaryNotes: "Halal", respondedAt: "3 days ago" },
        { id: "23", name: "Isabella Green", email: "isabella@example.com", status: "pending", plusOne: false },
        { id: "24", name: "Henry King", email: "henry@example.com", phone: "+1 555-0306", status: "confirmed", plusOne: true, respondedAt: "6 days ago" },
    ],
}

export function getGuestsByInvitationId(id?: string): Guest[] {
    if (!id) return guestLists["evt-1"]
    return guestLists[id] ?? guestLists["evt-1"]
}
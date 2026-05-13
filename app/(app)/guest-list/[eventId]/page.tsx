"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { GuestListPage } from "@/components/app/guest-list-page"
import { auth } from "@/lib/firebase"
import type { InvitationSummary } from "@/lib/invitations"
import type { Guest } from "@/lib/guest-lists"
import { Spinner } from "@/components/ui/spinner"

export default function GuestListRoutePage() {
    const params = useParams()
    const eventId = params.eventId as string
    const [invitation, setInvitation] = useState<InvitationSummary | null>(null)
    const [guests, setGuests] = useState<Guest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadData = async () => {
            try {
                const user = auth.currentUser
                if (!user) {
                    setError("Not authenticated")
                    return
                }

                const token = await user.getIdToken()

                // Fetch event details
                const eventRes = await fetch("/api/events/list", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                })

                if (!eventRes.ok) {
                    setError("Failed to fetch event")
                    return
                }

                const eventData = await eventRes.json()
                const event = eventData.events?.find((e: any) => e.id === eventId)

                if (!event) {
                    setError("Event not found")
                    return
                }

                // Convert event to invitation summary
                const invitationSummary: InvitationSummary = {
                    id: event.id,
                    title: event.title,
                    description: event.description,
                    date: event.date,
                    time: event.time,
                    status: event.status as "active" | "draft",
                    guests: { confirmed: 0, total: 0 },
                }

                // Fetch invitations for this event
                const invitRes = await fetch("/api/invitations/list", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({ eventId }),
                })

                if (!invitRes.ok) {
                    setError("Failed to fetch invitations")
                    return
                }

                const invitData = await invitRes.json()
                const invitations = invitData.invitations || []

                // Convert invitations to Guest format
                const guestList: Guest[] = invitations.map((inv: any, index: number) => ({
                    id: inv.id,
                    name: inv.guestName || inv.guestEmail,
                    email: inv.guestEmail,
                    status: inv.status === "accepted" ? "confirmed" : inv.status === "declined" ? "declined" : "pending",
                    plusOne: false,
                    respondedAt: inv.respondedAt ? new Date(inv.respondedAt).toLocaleDateString() : undefined,
                }))

                // Calculate guest summary
                const confirmed = guestList.filter(g => g.status === "confirmed").length
                invitationSummary.guests = { confirmed, total: guestList.length }

                setInvitation(invitationSummary)
                setGuests(guestList)
            } catch (err) {
                console.error("Error loading data:", err)
                setError("An error occurred while loading data")
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [eventId])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
                <Spinner />
            </div>
        )
    }

    if (error || !invitation) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
                <div className="text-center">
                    <p className="text-lg font-medium">{error || "Unable to load guest list"}</p>
                </div>
            </div>
        )
    }

    return <GuestListPage invitation={invitation} guests={guests} />
}
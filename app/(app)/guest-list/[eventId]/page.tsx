import { notFound } from "next/navigation"

import { GuestListPage } from "@/components/app/guest-list-page"
import { invitations } from "@/lib/invitations"
import { getGuestsByInvitationId } from "@/lib/guest-lists"

export default async function GuestListRoutePage({
    params,
}: {
    params: Promise<{ eventId: string }>
}) {
    const { eventId } = await params

    const invitation = invitations.find((event) => event.id === eventId)

    if (!invitation) {
        notFound()
    }

    const guests = getGuestsByInvitationId(eventId)

    return <GuestListPage invitation={invitation} guests={guests} />
}
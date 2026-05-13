import { redirect } from "next/navigation"

import { defaultInvitationId } from "@/lib/invitations"

export default function EventsRedirectPage({
    searchParams,
}: {
    searchParams?: { id?: string }
}) {
    redirect(`/guest-list/${searchParams?.id || defaultInvitationId}`)
}
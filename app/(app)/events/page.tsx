import { redirect } from "next/navigation"

import { defaultInvitationId } from "@/lib/invitations"

export default async function EventsRedirectPage({
    searchParams,
}: {
    searchParams?: Promise<{ id?: string }>
}) {
    const resolvedSearchParams = await searchParams
    redirect(`/guest-list/${resolvedSearchParams?.id || defaultInvitationId}`)
}
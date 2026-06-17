import GuestListClient from "./guest-list-client"

export default async function GuestListPage({
    params,
}: {
    params: Promise<{ eventId: string }>
}) {
    const { eventId } = await params
    return <GuestListClient eventId={eventId} />
}

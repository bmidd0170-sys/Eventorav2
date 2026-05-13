import { redirect } from "next/navigation"

export default async function EventGuestListPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params

  redirect(`/guest-list/${eventId}`)
}
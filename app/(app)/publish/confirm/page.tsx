import PublishConfirmClient from "./confirm-client"

export default async function PublishConfirmPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    await searchParams
    return <PublishConfirmClient />
}

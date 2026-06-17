import PublishClient from "./publish-client"

export default async function PublishPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    await searchParams
    return <PublishClient />
}

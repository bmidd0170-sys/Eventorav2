import PreviewClient from "./preview-client"

export default async function PreviewPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    await searchParams
    return <PreviewClient />
}

import EditorClient from "./editor-client"

export default async function EditorPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    await searchParams
    return <EditorClient />
}

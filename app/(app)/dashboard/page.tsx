import DashboardClient from "./dashboard-client"

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    await searchParams
    return <DashboardClient />
}

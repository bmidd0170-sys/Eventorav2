import { AppNavigation } from "@/components/app/app-navigation"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppNavigation />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

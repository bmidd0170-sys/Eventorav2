import { Suspense } from "react"

import { AppNavigation } from "@/components/app/app-navigation"
import { TutorialWalkthrough } from "@/components/app/tutorial-walkthrough"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppNavigation />
      <TutorialWalkthrough />
      <main className="flex-1">
        <Suspense fallback={<div className="min-h-[calc(100vh-3.5rem)] bg-background" />}>
          {children}
        </Suspense>
      </main>
    </div>
  )
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Redirect to the new unified editor experience
export default function BuilderPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/editor")
  }, [router])

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">
        Loading editor...
      </div>
    </div>
  )
}

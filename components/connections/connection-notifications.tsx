"use client"

import { useEffect, useRef } from "react"
import { getPendingRequests } from "@/lib/connections"
import { useToast } from "@/hooks/use-toast"

type Props = {
  currentUserId?: string | null
  onNewRequest?: () => void
}

export default function ConnectionNotifications({ currentUserId, onNewRequest }: Props) {
  const { toast } = useToast()
  const previousRequestIdsRef = useRef<string[]>([])
  const hasLoadedOnceRef = useRef(false)

  useEffect(() => {
    if (!currentUserId) return

    let active = true

    const pollRequests = async () => {
      try {
        const data = await getPendingRequests(currentUserId)
        const requests = data.incoming || []
        if (!active) {
          return
        }

        const previousIds = previousRequestIdsRef.current
        const currentIds = requests.map((request) => request.id)

        if (hasLoadedOnceRef.current) {
          requests.forEach((request) => {
            if (!previousIds.includes(request.id)) {
              toast({
                title: "New connection request",
                description: `${request.fromUserName} — ${request.fromUserEmail}`,
              })
              onNewRequest?.()
            }
          })
        }

        if (!hasLoadedOnceRef.current) {
          hasLoadedOnceRef.current = true
        }

        previousRequestIdsRef.current = currentIds
      } catch (error) {
        console.warn("Failed to poll connection requests", error)
      }
    }

    pollRequests()
    const interval = setInterval(pollRequests, 15000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [currentUserId, onNewRequest, toast])

  return null
}

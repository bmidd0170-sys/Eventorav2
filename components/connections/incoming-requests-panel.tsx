"use client"

import type { ConnectionRequest } from "@/lib/connections"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

type Props = {
  currentUserId?: string | null
  requests: ConnectionRequest[]
  onAccept: (request: ConnectionRequest) => void
  onReject: (requestId: string) => void
}

export default function IncomingRequestsPanel({ currentUserId, requests, onAccept, onReject }: Props) {
  if (!currentUserId || requests.length === 0) return null

  return (
    <aside className="fixed right-6 top-24 w-80 z-40">
      <div className="bg-card rounded-xl border border-border/50 p-4 shadow-md">
        <h3 className="text-sm font-medium mb-2">Incoming Requests ({requests.length})</h3>
        <div className="space-y-2 max-h-64 overflow-auto">
          {requests.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded-md">
              <div className="min-w-0">
                <p className="font-medium truncate">{r.fromUserName}</p>
                <p className="text-xs text-muted-foreground truncate">{r.fromUserEmail}</p>
              </div>
              <div className="flex gap-2 ml-3">
                <Button size="sm" className="gradient-primary border-0 text-white" onClick={() => onAccept(r)}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => onReject(r.id)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

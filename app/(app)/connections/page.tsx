"use client"

import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import {
  getConnections,
  getPendingRequests,
  removeConnection,
  blockUser,
  acceptConnectionRequest,
  rejectConnectionRequest,
  sendConnectionRequest,
  type Connection,
  type ConnectionRequest,
} from "@/lib/connections"
import ConnectionNotifications from "@/components/connections/connection-notifications"
import IncomingRequestsPanel from "@/components/connections/incoming-requests-panel"
import { Button } from "@/components/ui/button"
import {
  Users,
  Mail,
  Plus,
  Trash2,
  Check,
  X,
} from "lucide-react"

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string>("You")
  const [email, setEmail] = useState("")
  const [sendingRequest, setSendingRequest] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid)
        setCurrentUserName(user.displayName || user.email?.split("@")[0] || "You")
        loadConnections(user.uid)
        loadPendingRequests(user.uid)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const loadConnections = async (userId: string) => {
    try {
      setLoading(true)
      const data = await getConnections(userId)
      setConnections(data)
      setError(null)
    } catch (err) {
      console.error("Error loading connections:", err)
      setError("Failed to load connections")
    } finally {
      setLoading(false)
    }
  }

  const loadPendingRequests = async (userId: string) => {
    try {
      const data = await getPendingRequests(userId)
      setPendingRequests(data)
    } catch (err) {
      console.error("Error loading pending requests:", err)
    }
  }

  const handleRemoveConnection = async (connectionId: string, connectedUserId: string) => {
    try {
      await removeConnection(currentUserId!, connectedUserId)
      setConnections(connections.filter((c) => c.id !== connectionId))
    } catch (err) {
      console.error("Error removing connection:", err)
      setError("Failed to remove connection")
    }
  }

  const handleBlockUser = async (
    connectionId: string,
    blockedUserId: string,
    blockedUserName: string,
    blockedUserEmail: string
  ) => {
    try {
      await blockUser(currentUserId!, blockedUserId, blockedUserName, blockedUserEmail)
      setConnections(connections.filter((c) => c.id !== connectionId))
    } catch (err) {
      console.error("Error blocking user:", err)
      setError("Failed to block user")
    }
  }

  const handleAcceptRequest = async (request: ConnectionRequest) => {
    try {
      await acceptConnectionRequest(
        request.id,
        request.fromUserId,
        request.toUserId,
        request.fromUserName,
        currentUserName,
        request.fromUserEmail,
        auth.currentUser?.email || ""
      )
      setPendingRequests(pendingRequests.filter((r) => r.id !== request.id))
      if (currentUserId) {
        loadConnections(currentUserId)
      }
    } catch (err) {
      console.error("Error accepting request:", err)
      setError("Failed to accept connection request")
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectConnectionRequest(requestId)
      setPendingRequests(pendingRequests.filter((r) => r.id !== requestId))
    } catch (err) {
      console.error("Error rejecting request:", err)
      setError("Failed to reject connection request")
    }
  }

  const handleSendConnectionRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError("Please enter an email address")
      return
    }

    if (!currentUserId) {
      setError("You must be logged in to send a connection request")
      return
    }

    try {
      setSendingRequest(true)
      setError(null)
      setSuccessMessage(null)

      const userEmail = auth.currentUser?.email || ""
      await sendConnectionRequest(
        currentUserId,
        email,
        currentUserName,
        userEmail,
        email
      )

      setSuccessMessage(`Connection request sent to ${email}`)
      setEmail("")
      
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error("Error sending connection request:", err)
      setError("Failed to send connection request. Please try again.")
    } finally {
      setSendingRequest(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ConnectionNotifications currentUserId={currentUserId} onNewRequest={() => currentUserId && loadPendingRequests(currentUserId)} />
      <IncomingRequestsPanel currentUserId={currentUserId} requests={pendingRequests} onAccept={handleAcceptRequest} onReject={handleRejectRequest} />
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Connections</h1>
        <p className="text-muted-foreground">Manage all of your connections</p>
      </div>

      <div className="space-y-8">
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-700 dark:text-green-400 text-sm">
            ✓ {successMessage}
          </div>
        )}

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <section className="bg-card rounded-xl border border-border/50 p-6">
            <h2 className="text-lg font-medium mb-4">Connection Requests ({pendingRequests.length})</h2>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{request.fromUserName}</p>
                    <p className="text-sm text-muted-foreground truncate">{request.fromUserEmail}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      className="gradient-primary border-0 text-white"
                      onClick={() => handleAcceptRequest(request)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border/50"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active Connections */}
        <section className="bg-card rounded-xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium">Your Connections</h2>
              <p className="text-sm text-muted-foreground">{connections.length} connection{connections.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading connections...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No connections yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Start connecting with other users to collaborate
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/30 hover:border-border/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{connection.connectedUserName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{connection.connectedUserEmail}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveConnection(connection.id, connection.connectedUserId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border/50"
                      onClick={() =>
                        handleBlockUser(
                          connection.id,
                          connection.connectedUserId,
                          connection.connectedUserName,
                          connection.connectedUserEmail
                        )
                      }
                    >
                      Block
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Add Connection */}
        <section className="bg-card rounded-xl border border-border/50 p-6">
          <h2 className="text-lg font-medium mb-4">Add Connection</h2>
          <form onSubmit={handleSendConnectionRequest} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email to connect with user"
                disabled={sendingRequest}
                className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
            </div>
            <Button 
              type="submit"
              disabled={sendingRequest}
              className="gradient-primary border-0 text-white disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              {sendingRequest ? "Sending..." : "Send Connection Request"}
            </Button>
            <p className="text-xs text-muted-foreground">
              The user will receive a connection request and can accept or decline.
            </p>
          </form>
        </section>
      </div>
    </div>
  )
}

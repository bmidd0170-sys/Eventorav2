"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getConnections, removeConnection, blockUser, searchUsers, sendConnectionRequest, type Connection, type UserSearchResult } from "@/lib/connections"
import { Users, Mail, Trash2, Plus, Search, Loader2, X } from "lucide-react"

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string>("You")
  const [email, setEmail] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [sendingRequest, setSendingRequest] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid)
        setCurrentUserName(user.displayName || user.email?.split("@")[0] || "You")
        loadConnections(user.uid)
      } else {
        setCurrentUserId(null)
        setConnections([])
        setLoading(false)
      }
    })

    return () => unsubscribe()
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

  const handleRemoveConnection = async (connectionId: string, connectedUserId: string) => {
    try {
      await removeConnection(currentUserId!, connectedUserId)
      setConnections((prev) => prev.filter((c) => c.id !== connectionId))
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
      setConnections((prev) => prev.filter((c) => c.id !== connectionId))
    } catch (err) {
      console.error("Error blocking user:", err)
      setError("Failed to block user")
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

      await sendConnectionRequest(
        currentUserId,
        email,
        currentUserName,
        auth.currentUser?.email || "",
        email
      )

      setSuccessMessage(`Connection request sent to ${email}`)
      setEmail("")
      setSelectedUser(null)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error("Error sending connection request:", err)
      setError("Failed to send connection request. Please try again.")
    } finally {
      setSendingRequest(false)
    }
  }

  const handleSelectSearchResult = (user: UserSearchResult) => {
    setEmail(user.email)
    setSelectedUser(user)
    setSearchQuery("")
    setSearchResults([])
    setSearchError(null)
  }

  useEffect(() => {
    const query = searchQuery.trim()

    if (!query) {
      setSearchResults([])
      setSearchError(null)
      setSearchLoading(false)
      return
    }

    if (!currentUserId) {
      setSearchResults([])
      setSearchError("Sign in to search Eventora users.")
      setSearchLoading(false)
      return
    }

    let isActive = true
    const timeoutId = window.setTimeout(async () => {
      setSearchLoading(true)
      setSearchError(null)

      try {
        const users = await searchUsers(query)
        if (!isActive) return
        setSearchResults(users)
      } catch (err) {
        if (!isActive) return
        console.error("Error searching users:", err)
        setSearchResults([])
        setSearchError("Could not search users right now.")
      } finally {
        if (isActive) setSearchLoading(false)
      }
    }, 300)

    return () => {
      isActive = false
      window.clearTimeout(timeoutId)
    }
  }, [currentUserId, searchQuery])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Connections</h1>
        <p className="text-muted-foreground">View all of your current connections</p>
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

        <section className="bg-card rounded-xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium">Your Connections</h2>
              <p className="text-sm text-muted-foreground">
                {connections.length} connection{connections.length !== 1 ? "s" : ""}
              </p>
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
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={undefined} alt={connection.connectedUserName} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30 text-sm font-medium">
                        {connection.connectedUserName
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{connection.connectedUserName}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{connection.connectedUserEmail}</span>
                      </div>
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

        <section className="bg-card rounded-xl border border-border/50 p-6">
          <h2 className="text-lg font-medium mb-4">Add Connection</h2>
          <form onSubmit={handleSendConnectionRequest} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search by name or email</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email"
                  className="w-full bg-secondary rounded-lg px-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />

                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Searching…</div>
                )}

                {searchError && <div className="text-sm text-destructive mt-1">{searchError}</div>}

                {searchResults.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-2 bg-card rounded-lg border border-border/50 shadow-md max-h-56 overflow-auto">
                    {searchResults.map((user) => {
                      const name = user.displayName || user.email

                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleSelectSearchResult(user)}
                          className="w-full text-left px-3 py-2 hover:bg-secondary/40 flex items-center gap-3"
                        >
                          <Avatar className="w-9 h-9">
                            <AvatarImage src={user.photoUrl || undefined} alt={name} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30 text-sm font-medium uppercase">
                              {name.slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{name}</div>
                            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {selectedUser ? (
                <div className="mt-3 rounded-xl border border-border/50 bg-secondary/30 p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex items-center gap-3">
                    <Avatar className="w-11 h-11">
                      <AvatarImage src={selectedUser.photoUrl || undefined} alt={selectedUser.displayName || selectedUser.email} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30 font-medium uppercase">
                        {(selectedUser.displayName || selectedUser.email).slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{selectedUser.displayName || selectedUser.email}</p>
                      <p className="text-sm text-muted-foreground truncate">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground bg-secondary rounded-full px-3 py-1">Ready to connect</span>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-border/50"
                      onClick={() => {
                        setSelectedUser(null)
                        setEmail("")
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground">
                  Search for a user and pick them from the list to show their profile details here.
                </div>
              )}
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

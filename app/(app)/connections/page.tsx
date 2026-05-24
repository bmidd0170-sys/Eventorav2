"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ConnectionNotifications from "@/components/connections/connection-notifications"
import IncomingRequestsPanel from "@/components/connections/incoming-requests-panel"
import { useConnectionsManager } from "@/components/connections/use-connections-manager"
import {
  AlertCircle,
  Loader2,
  Mail,
  Plus,
  Search,
  Users,
  Check,
  X,
} from "lucide-react"

export default function ConnectionsPage() {
  const {
    connections,
    pendingRequests,
    loadingConnections,
    error,
    currentUserId,
    email,
    setEmail,
    sendingRequest,
    successMessage,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    searchError,
    refreshPendingRequests,
    handleAcceptRequest,
    handleRejectRequest,
    handleSendConnectionRequest,
  } = useConnectionsManager({ enableSearch: true })

  useEffect(() => {
    if (!currentUserId) {
      return
    }

    const interval = window.setInterval(() => {
      void refreshPendingRequests()
    }, 15000)

    return () => window.clearInterval(interval)
  }, [currentUserId, refreshPendingRequests])

  const selectedSearchResult = searchResults.find((result) => result.email === email) ?? null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ConnectionNotifications
        currentUserId={currentUserId}
        onNewRequest={() => void refreshPendingRequests()}
      />
      <IncomingRequestsPanel
        currentUserId={currentUserId}
        requests={pendingRequests}
        onAccept={handleAcceptRequest}
        onReject={handleRejectRequest}
      />

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Connections</h1>
        <p className="text-muted-foreground">Manage all of your connections</p>
      </div>

      <div className="space-y-8">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-400">
            ✓ {successMessage}
          </div>
        )}

        <section className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="mb-4 text-lg font-medium">Add Connection</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Search by name or email</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email"
                  className="pl-9"
                />
              </div>
            </div>

            {searchError && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {searchLoading && (
                <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/40 px-4 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching users...
                </div>
              )}

              {!searchLoading && searchQuery.trim() && searchResults.length === 0 && !searchError && (
                <div className="rounded-xl border border-border/50 bg-secondary/40 px-4 py-6 text-sm text-muted-foreground">
                  No users found. Try a full name or email address.
                </div>
              )}

              {searchResults.map((result) => {
                const isSelected = selectedSearchResult?.id === result.id

                return (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => setEmail(result.email)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-primary/50 bg-primary/10"
                        : "border-border/50 bg-secondary/30 hover:border-border/70"
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={result.photoUrl || undefined} alt={result.name} />
                      <AvatarFallback>{result.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{result.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{result.email}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{isSelected ? "Selected" : "Choose"}</div>
                  </button>
                )
              })}
            </div>

            <form onSubmit={handleSendConnectionRequest} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email to connect with user"
                  disabled={sendingRequest}
                  className="w-full rounded-lg bg-secondary px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                />
              </div>
              <Button type="submit" disabled={sendingRequest} className="gradient-primary border-0 text-white disabled:opacity-50">
                <Plus className="mr-2 h-4 w-4" />
                {sendingRequest ? "Sending..." : "Send Connection Request"}
              </Button>
              <p className="text-xs text-muted-foreground">
                The user will receive a connection request and can accept or decline.
              </p>
            </form>
          </div>
        </section>

        {pendingRequests.length > 0 && (
          <section className="rounded-xl border border-border/50 bg-card p-6">
            <h2 className="mb-4 text-lg font-medium">Connection Requests ({pendingRequests.length})</h2>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{request.fromUserName}</p>
                    <p className="truncate text-sm text-muted-foreground">{request.fromUserEmail}</p>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <Button size="sm" className="gradient-primary border-0 text-white" onClick={() => handleAcceptRequest(request)}>
                      <Check className="mr-1 h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border/50"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-xl border border-border/50 bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Your Connections</h2>
              <p className="text-sm text-muted-foreground">
                {connections.length} connection{connections.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {loadingConnections ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading connections...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">No connections yet</p>
              <p className="mt-1 text-sm text-muted-foreground/70">Start connecting with other users to collaborate</p>
            </div>
          ) : (
            <div className="space-y-2">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 p-4 transition-colors hover:border-border/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{connection.connectedUserName}</p>
                    <div className="flex items-center gap-2 truncate text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{connection.connectedUserEmail}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-shrink-0 gap-2 text-xs text-muted-foreground">
                    Managed in Settings
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
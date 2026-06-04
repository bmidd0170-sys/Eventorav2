"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { fetchWithAuth } from "@/lib/api-client"
import { useErrorPopup } from "@/components/providers/error-popup-provider"
import {
  acceptConnectionRequest,
  blockUser,
  getConnections,
  getOutgoingRequests,
  getPendingRequests,
  removeConnection,
  rejectConnectionRequest,
  sendConnectionRequest,
  type Connection,
  type ConnectionRequest,
} from "@/lib/connections"

export type ConnectionSearchResult = {
  id: string
  name: string
  email: string
  photoUrl?: string | null
}

type UseConnectionsManagerOptions = {
  enableSearch?: boolean
  includeOutgoingRequests?: boolean
}

export function useConnectionsManager({ enableSearch = false, includeOutgoingRequests = false }: UseConnectionsManagerOptions = {}) {
  const { showError } = useErrorPopup()
  const [connections, setConnections] = useState<Connection[]>([])
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<ConnectionRequest[]>([])
  const [loadingConnections, setLoadingConnections] = useState(true)
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [loadingOutgoingRequests, setLoadingOutgoingRequests] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string>("You")
  const [email, setEmail] = useState("")
  const [sendingRequest, setSendingRequest] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ConnectionSearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState("")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid)
        setCurrentUserName(user.displayName || user.email?.split("@")[0] || "You")
        void loadConnections(user.uid)
        void loadPendingRequests(user.uid)
        if (includeOutgoingRequests) {
          void loadOutgoingRequests(user.uid)
        }
        return
      }

      setCurrentUserId(null)
      setCurrentUserName("You")
      setConnections([])
      setPendingRequests([])
      setOutgoingRequests([])
      setLoadingConnections(false)
      setLoadingRequests(false)
      setLoadingOutgoingRequests(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!enableSearch) {
      return
    }

    const query = searchQuery.trim()

    if (!query) {
      setSearchResults([])
      setSearchError("")
      setSearchLoading(false)
      return
    }

    if (!currentUserId) {
      setSearchResults([])
      setSearchError("Sign in to search users.")
      setSearchLoading(false)
      return
    }

    let active = true

    const timeoutId = window.setTimeout(async () => {
      setSearchLoading(true)
      setSearchError("")

      try {
        const response = await fetchWithAuth(`/api/users/search?q=${encodeURIComponent(query)}`)

        if (!response.ok) {
          throw new Error(`Search failed with ${response.status}`)
        }

        const data = (await response.json()) as {
          users?: Array<{ id: string; email: string; displayName: string | null; photoUrl: string | null }>
        }

        if (!active) {
          return
        }

        const connectedUserIds = new Set(connections.map((connection) => connection.connectedUserId))
        const connectedUserEmails = new Set(
          connections.map((connection) => connection.connectedUserEmail.trim().toLowerCase())
        )

        setSearchResults(
          Array.isArray(data.users)
            ? data.users
                .filter((user) => {
                  const normalizedEmail = user.email.trim().toLowerCase()
                  return !connectedUserIds.has(user.id) && !connectedUserEmails.has(normalizedEmail)
                })
                .map((user) => ({
                  id: user.id,
                  name: user.displayName || user.email,
                  email: user.email,
                  photoUrl: user.photoUrl,
                }))
            : []
        )
      } catch (err) {
        if (!active) {
          return
        }

        console.error("Failed to search users:", err)
        setSearchResults([])
        setSearchError("Could not search users right now.")
      } finally {
        if (active) {
          setSearchLoading(false)
        }
      }
    }, 300)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [connections, currentUserId, enableSearch, searchQuery])

  const loadConnections = async (userId: string) => {
    try {
      setLoadingConnections(true)
      const data = await getConnections(userId)
      setConnections(data)
      setError(null)
    } catch (err) {
      console.error("Error loading connections:", err)
      setError("Failed to load connections")
      showError({
        title: "Connections unavailable",
        message: "We could not load your connections right now.",
      })
    } finally {
      setLoadingConnections(false)
    }
  }

  const loadPendingRequests = async (userId: string, silent = false) => {
    try {
      if (!silent) {
        setLoadingRequests(true)
      }
      const data = await getPendingRequests(userId)
      setPendingRequests(data)
    } catch (err) {
      console.error("Error loading pending requests:", err)
      showError({
        title: "Requests unavailable",
        message: "Incoming connection requests could not be loaded.",
        severity: "warning",
      })
    } finally {
      if (!silent) {
        setLoadingRequests(false)
      }
    }
  }

  const loadOutgoingRequests = async (userId: string, silent = false) => {
    try {
      if (!silent) {
        setLoadingOutgoingRequests(true)
      }
      const data = await getOutgoingRequests(userId)
      setOutgoingRequests(data)
    } catch (err) {
      console.error("Error loading outgoing requests:", err)
      showError({
        title: "Outgoing requests unavailable",
        message: "Sent requests could not be loaded right now.",
        severity: "warning",
      })
    } finally {
      if (!silent) {
        setLoadingOutgoingRequests(false)
      }
    }
  }

  const refreshConnections = async () => {
    if (currentUserId) {
      await loadConnections(currentUserId)
    }
  }

  const refreshPendingRequests = async () => {
    if (currentUserId) {
      await loadPendingRequests(currentUserId, true)
    }
  }

  const refreshOutgoingRequests = async () => {
    if (currentUserId) {
      await loadOutgoingRequests(currentUserId, true)
    }
  }

  const handleRemoveConnection = async (connectionId: string, connectedUserId: string) => {
    try {
      await removeConnection(currentUserId!, connectedUserId)
      setConnections((current) => current.filter((connection) => connection.id !== connectionId))
    } catch (err) {
      console.error("Error removing connection:", err)
      setError("Failed to remove connection")
      showError({
        title: "Could not remove connection",
        message: "Please try again in a moment.",
      })
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
      setConnections((current) => current.filter((connection) => connection.id !== connectionId))
    } catch (err) {
      console.error("Error blocking user:", err)
      setError("Failed to block user")
      showError({
        title: "Could not block user",
        message: "Please try again in a moment.",
      })
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
      setPendingRequests((current) => current.filter((item) => item.id !== request.id))
      await refreshConnections()
    } catch (err) {
      console.error("Error accepting request:", err)
      setError("Failed to accept connection request")
      showError({
        title: "Could not accept request",
        message: "Please try again in a moment.",
      })
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectConnectionRequest(requestId)
      setPendingRequests((current) => current.filter((request) => request.id !== requestId))
    } catch (err) {
      console.error("Error rejecting request:", err)
      setError("Failed to reject connection request")
      showError({
        title: "Could not reject request",
        message: "Please try again in a moment.",
      })
    }
  }

  const handleSendConnectionRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setError("Please enter an email address")
      showError({
        title: "Email required",
        message: "Enter an email address before sending a connection request.",
        severity: "info",
      })
      return
    }

    if (!currentUserId) {
      setError("You must be logged in to send a connection request")
      showError({
        title: "Please sign in",
        message: "Your session expired. Sign in again to send connection requests.",
        severity: "warning",
      })
      return
    }

    try {
      setSendingRequest(true)
      setError(null)
      setSuccessMessage(null)

      const userEmail = auth.currentUser?.email || ""
      await sendConnectionRequest(currentUserId, email, currentUserName, userEmail, email)

      setSuccessMessage(`Connection request sent to ${email}`)
      setEmail("")
      window.setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error("Error sending connection request:", err)
      setError("Failed to send connection request. Please try again.")
      showError({
        title: "Request not sent",
        message: err instanceof Error ? err.message : "We could not send this connection request right now.",
      })
    } finally {
      setSendingRequest(false)
    }
  }

  return {
    connections,
    pendingRequests,
    outgoingRequests,
    loadingConnections,
    loadingRequests,
    loadingOutgoingRequests,
    error,
    setError,
    currentUserId,
    currentUserName,
    email,
    setEmail,
    sendingRequest,
    successMessage,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    searchError,
    setSearchError,
    refreshConnections,
    refreshPendingRequests,
    refreshOutgoingRequests,
    handleRemoveConnection,
    handleBlockUser,
    handleAcceptRequest,
    handleRejectRequest,
    handleSendConnectionRequest,
  }
}
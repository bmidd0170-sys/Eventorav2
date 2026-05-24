"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { auth } from "@/lib/firebase"
import { getConnections } from "@/lib/connections"
import {
  Link2,
  Mail,
  Users,
  Check,
  Copy,
  ChevronLeft,
  ArrowRight,
  QrCode,
  MessageSquare,
  Share2,
  Globe,
  Lock,
  Send,
  Plus,
  X,
  Sparkles,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react"

type InviteMethod = "link" | "email" | "connections"

type Contact = {
  id: string
  name: string
  email: string
  photoUrl?: string | null
}

export default function PublishPage() {
  const searchParams = useSearchParams()
  const eventParam = searchParams?.get("event")
  const projectParam = searchParams?.get("project")
  const titleParam = searchParams?.get("title")
  const pagesParam = searchParams?.get("pages")
  const dateParam = searchParams?.get("date")
  const timeParam = searchParams?.get("time")
  const shareMode = searchParams?.get("published") === "true" || searchParams?.get("step") === "share"
  const titleFromParams = titleParam ?? "Summer Party 2026"
  const pagesCount = pagesParam ? Number(pagesParam) : 3
  const [resolvedEventId, setResolvedEventId] = useState((eventParam || projectParam || "").trim())
  const invitePath = resolvedEventId ? `/i/${encodeURIComponent(resolvedEventId)}` : ""
  const [activeMethod, setActiveMethod] = useState<InviteMethod>("link")
  const [linkCopied, setLinkCopied] = useState(false)
  const [isPublished, setIsPublished] = useState(shareMode)
  const [inviteLink, setInviteLink] = useState(invitePath)
  const [emailAddresses, setEmailAddresses] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser)
  const [searchQuery, setSearchQuery] = useState("")
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const [linkVisibility, setLinkVisibility] = useState<"public" | "private">("public")
  const [emailSubject, setEmailSubject] = useState("You're Invited!")
  const [emailMessage, setEmailMessage] = useState("I'd love for you to join me at this special event. Click the link below to view the invitation and RSVP.")
  const [isSendingEmails, setIsSendingEmails] = useState(false)
  const [emailSendStatus, setEmailSendStatus] = useState<{ success: number; failed: number; errors: { email: string; error: string }[] } | null>(null)

  useEffect(() => {
    setIsPublished(shareMode)
  }, [shareMode])

  useEffect(() => {
    const eventIdFromParams = (eventParam || projectParam || "").trim()
    if (!eventIdFromParams) {
      return
    }

    setResolvedEventId(eventIdFromParams)

    if (typeof window !== "undefined") {
      localStorage.setItem("invyra-last-published-event-id", eventIdFromParams)
    }
  }, [eventParam, projectParam])

  useEffect(() => {
    if (resolvedEventId) {
      return
    }

    if (typeof window === "undefined") {
      return
    }

    const lastPublishedEventId = localStorage.getItem("invyra-last-published-event-id")
    if (lastPublishedEventId) {
      setResolvedEventId(lastPublishedEventId)
    }
  }, [resolvedEventId])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    if (!invitePath) {
      setInviteLink("")
      return
    }

    setInviteLink(`${window.location.origin}${invitePath}`)
  }, [invitePath])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    let isActive = true

    const loadConnections = async () => {
      if (!currentUser) {
        setContacts([])
        setSearchError("Sign in to view your connections.")
        setSearchLoading(false)
        return
      }

      setSearchLoading(true)
      setSearchError("")

      try {
        const connections = await getConnections(currentUser.uid)

        if (!isActive) {
          return
        }

        setContacts(
          connections.map((connection) => ({
            id: connection.connectedUserId,
            name: connection.connectedUserName,
            email: connection.connectedUserEmail,
          }))
        )
      } catch (error) {
        if (!isActive) {
          return
        }

        console.error("Failed to load connections:", error)
        setContacts([])
        setSearchError("Could not load your connections right now.")
      } finally {
        if (isActive) {
          setSearchLoading(false)
        }
      }
    }

    void loadConnections()

    return () => {
      isActive = false
    }
  }, [currentUser])

  const filteredContacts = contacts.filter((contact) => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return true
    }

    return contact.name.toLowerCase().includes(query) || contact.email.toLowerCase().includes(query)
  })

  const handleCopyLink = () => {
    if (!inviteLink) {
      return
    }

    navigator.clipboard.writeText(inviteLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handlePublish = () => {
    setIsPublished(true)
  }

  const handleAddEmail = () => {
    if (newEmail && newEmail.includes("@") && !emailAddresses.includes(newEmail)) {
      setEmailAddresses([...emailAddresses, newEmail])
      setNewEmail("")
    }
  }

  const handleRemoveEmail = (email: string) => {
    setEmailAddresses(emailAddresses.filter(e => e !== email))
  }

  const toggleContact = (contact: Contact) => {
    setSelectedContacts((previous) => {
      const alreadySelected = previous.some((selected) => selected.id === contact.id)

      if (alreadySelected) {
        return previous.filter((selected) => selected.id !== contact.id)
      }

      return [...previous, contact]
    })
  }

  const handleSendEmails = async () => {
    const emailsToSend = activeMethod === "connections"
      ? selectedContacts.map((contact) => contact.email)
      : emailAddresses

    if (!emailsToSend.length || !inviteLink || !resolvedEventId) return

    setIsSendingEmails(true)
    setEmailSendStatus(null)

    try {
      const user = auth.currentUser
      if (!user) {
        console.error('Not authenticated')
        setEmailSendStatus({ success: 0, failed: emailsToSend.length, errors: emailsToSend.map(e => ({ email: e, error: 'Not authenticated' })) })
        setIsSendingEmails(false)
        return
      }

      const token = await user.getIdToken()

      // Send invitations via the new endpoint that creates database records
      const response = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: resolvedEventId,
          emails: emailsToSend,
          subject: emailSubject,
          message: emailMessage,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to send invitations:', errorData)
        setEmailSendStatus({ 
          success: 0, 
          failed: emailsToSend.length, 
          errors: emailsToSend.map(e => ({ email: e, error: errorData.error || 'Failed to send' })) 
        })
        setIsSendingEmails(false)
        return
      }

      const result = await response.json()
      console.log(`Successfully sent ${result.count} invitations`)

      // Track email results
      const emailResults = result.emailResults || []
      const successCount = emailResults.filter((r: any) => r.success).length
      const failedCount = emailResults.filter((r: any) => !r.success).length
      const errors = emailResults.filter((r: any) => !r.success).map((r: any) => ({ email: r.email, error: r.error }))

      setEmailSendStatus({ success: successCount, failed: failedCount, errors })

      // Clear the email list after sending only if all succeeded
      if (failedCount === 0) {
        if (activeMethod === "email") {
          setEmailAddresses([])
          setNewEmail("")
        } else if (activeMethod === "connections") {
          setSelectedContacts([])
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error('Failed to send invitations:', error)
      setEmailSendStatus({ 
        success: 0, 
        failed: emailsToSend.length, 
        errors: emailsToSend.map(e => ({ email: e, error: errorMsg })) 
      })
    } finally {
      setIsSendingEmails(false)
    }
  }

  const selectedContactIds = new Set(selectedContacts.map((contact) => contact.id))

  const methods = [
    {
      id: "link" as const,
      label: "Share Link",
      icon: Link2,
      description: "Copy a link to share anywhere"
    },
    {
      id: "email" as const,
      label: "Send Email",
      icon: Mail,
      description: "Send invitations via email"
    },
    {
      id: "connections" as const,
      label: "Connections",
      icon: Users,
      description: "Invite from your contact list"
    },
  ]

  if (!isPublished) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-background flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-border/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link href="/editor" className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-medium">Publish Your Invitation</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-lg text-center">
            {/* Preview card */}
            <div className="mb-8 mx-auto w-64 aspect-[3/4] rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-chart-3/20 border border-border/50 flex items-center justify-center">
              <div className="text-center p-6">
                <div className="w-12 h-12 rounded-xl gradient-primary mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">{titleFromParams}</h3>
                <p className="text-xs text-muted-foreground">{pagesCount} pages ready</p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold mb-3">Ready to share your invitation?</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Publish your invitation to make it live. You&apos;ll be able to share it via link, email, or directly to your connections.
            </p>

            <Button
              size="lg"
              className="gradient-primary border-0 text-white px-8"
              onClick={handlePublish}
            >
              Publish Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      {/* Header */}
      <div className="h-14 border-b border-border/50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/editor" className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <h1 className="font-medium">Invitation Published</h1>
          </div>
        </div>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            Go to Dashboard
          </Button>
        </Link>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto p-8">
        {/* Success banner */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
            <Check className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h2 className="font-semibold text-lg mb-1">Your invitation is live!</h2>
            <p className="text-muted-foreground text-sm">Choose how you want to share it with your guests.</p>
            {(dateParam || timeParam) && (
              <p className="text-xs text-muted-foreground mt-2">
                {dateParam ?? ""}
                {dateParam && timeParam ? " • " : ""}
                {timeParam ?? ""}
              </p>
            )}
          </div>
        </div>

        {/* Method tabs */}
        <div className="flex gap-2 mb-8">
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => setActiveMethod(method.id)}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all ${activeMethod === method.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border/50 bg-card hover:border-border hover:bg-card/80 text-muted-foreground"
                }`}
            >
              <method.icon className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium text-sm">{method.label}</div>
                <div className="text-xs text-muted-foreground">{method.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Method content */}
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          {activeMethod === "link" && (
            <div className="space-y-6">
              {/* Link visibility */}
              <div>
                <label className="text-sm font-medium mb-3 block">Link Visibility</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setLinkVisibility("public")}
                    className={`flex-1 flex items-center gap-3 p-4 rounded-xl border transition-all ${linkVisibility === "public"
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-border"
                      }`}
                  >
                    <Globe className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Public</div>
                      <div className="text-xs text-muted-foreground">Anyone with the link can view</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setLinkVisibility("private")}
                    className={`flex-1 flex items-center gap-3 p-4 rounded-xl border transition-all ${linkVisibility === "private"
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-border"
                      }`}
                  >
                    <Lock className="w-5 h-5 text-accent" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Private</div>
                      <div className="text-xs text-muted-foreground">Only invited emails can view</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Copy link */}
              <div>
                <label className="text-sm font-medium mb-3 block">Invitation Link</label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-secondary rounded-xl">
                    <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{inviteLink}</span>
                  </div>
                  <Button
                    onClick={handleCopyLink}
                    className={linkCopied ? "bg-green-500 hover:bg-green-500" : ""}
                  >
                    {linkCopied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Share options */}
              <div>
                <label className="text-sm font-medium mb-3 block">Quick Share</label>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1">
                    <QrCode className="w-4 h-4 mr-2" />
                    QR Code
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    More
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeMethod === "email" && (
            <div className="space-y-6">
              {/* Email addresses */}
              <div>
                <label className="text-sm font-medium mb-3 block">Recipients</label>
                <div className="flex gap-2 mb-3">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                    className="flex-1"
                  />
                  <Button onClick={handleAddEmail}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>

                {emailAddresses.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {emailAddresses.map((email) => (
                      <div
                        key={email}
                        className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-sm"
                      >
                        <span>{email}</span>
                        <button
                          onClick={() => handleRemoveEmail(email)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Email subject */}
              <div>
                <label className="text-sm font-medium mb-3 block">Subject Line</label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>

              {/* Email message */}
              <div>
                <label className="text-sm font-medium mb-3 block">Personal Message</label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={4}
                  className="w-full bg-secondary px-4 py-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Email send status */}
              {emailSendStatus && (
                <div className={`rounded-xl border p-4 space-y-2 ${
                  emailSendStatus.failed === 0
                    ? "border-green-500/20 bg-green-500/10"
                    : "border-amber-500/20 bg-amber-500/10"
                }`}>
                  <div className="text-sm font-medium">
                    {emailSendStatus.failed === 0 ? (
                      <span className="text-green-700 dark:text-green-400">✓ All emails sent successfully</span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400">
                        {emailSendStatus.success > 0 ? `✓ ${emailSendStatus.success} sent, ` : ''}
                        ✗ {emailSendStatus.failed} failed
                      </span>
                    )}
                  </div>
                  {emailSendStatus.errors.length > 0 && (
                    <div className="text-xs space-y-1 mt-2">
                      {emailSendStatus.errors.map((err, idx) => (
                        <div key={idx} className="text-amber-700 dark:text-amber-400">
                          <strong>{err.email}:</strong> {err.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Send button */}
              <Button
                className="w-full gradient-primary border-0 text-white"
                disabled={emailAddresses.length === 0 || isSendingEmails}
                onClick={handleSendEmails}
              >
                {isSendingEmails ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send {emailAddresses.length > 0 ? `to ${emailAddresses.length} recipient${emailAddresses.length > 1 ? 's' : ''}` : 'Invitations'}
                  </>
                )}
              </Button>
            </div>
          )}

          {activeMethod === "connections" && (
            <div className="space-y-6">
              {/* Search */}
              <div>
                <label className="text-sm font-medium mb-3 block">Your connections</label>
                <div className="relative mb-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Filter by name or email"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {searchError && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{searchError}</span>
                  </div>
                )}

                {/* Contacts list */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {searchLoading && (
                    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/40 px-4 py-4 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading connections...
                    </div>
                  )}

                  {!searchLoading && !searchQuery.trim() && contacts.length === 0 && !searchError && (
                    <div className="rounded-xl border border-border/50 bg-secondary/40 px-4 py-6 text-sm text-muted-foreground">
                      You do not have any connections yet.
                    </div>
                  )}

                  {!searchLoading && searchQuery.trim() && filteredContacts.length === 0 && !searchError && (
                    <div className="rounded-xl border border-border/50 bg-secondary/40 px-4 py-6 text-sm text-muted-foreground">
                      No connections match that search.
                    </div>
                  )}

                  {filteredContacts.map((contact) => {
                    const isSelected = selectedContactIds.has(contact.id)

                    return (
                      <button
                        key={contact.id}
                        onClick={() => toggleContact(contact)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-border hover:bg-card/50"
                          }`}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={contact.photoUrl || undefined} alt={contact.name} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30 text-sm font-medium">
                            {contact.name.split(" ").map((namePart) => namePart[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{contact.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{contact.email}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                          ? "border-primary bg-primary"
                          : "border-border"
                          }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedContacts.length > 0 && (
                <div className="rounded-2xl border border-border/50 bg-secondary/30 p-4 space-y-3">
                  <div className="text-sm font-medium">Selected users</div>
                  <div className="space-y-2">
                    {selectedContacts.map((contact) => (
                      <div key={contact.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/60 px-3 py-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={contact.photoUrl || undefined} alt={contact.name} />
                          <AvatarFallback className="bg-secondary text-xs font-medium">
                            {contact.name.split(" ").map((namePart) => namePart[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{contact.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{contact.email}</div>
                        </div>
                        <button
                          onClick={() => toggleContact(contact)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected count and send */}
              <div className="space-y-4">
                {/* Email send status */}
                {emailSendStatus && (
                  <div className={`rounded-xl border p-4 space-y-2 ${
                    emailSendStatus.failed === 0
                      ? "border-green-500/20 bg-green-500/10"
                      : "border-amber-500/20 bg-amber-500/10"
                  }`}>
                    <div className="text-sm font-medium">
                      {emailSendStatus.failed === 0 ? (
                        <span className="text-green-700 dark:text-green-400">✓ All emails sent successfully</span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-400">
                          {emailSendStatus.success > 0 ? `✓ ${emailSendStatus.success} sent, ` : ''}
                          ✗ {emailSendStatus.failed} failed
                        </span>
                      )}
                    </div>
                    {emailSendStatus.errors.length > 0 && (
                      <div className="text-xs space-y-1 mt-2">
                        {emailSendStatus.errors.map((err, idx) => (
                          <div key={idx} className="text-amber-700 dark:text-amber-400">
                            <strong>{err.email}:</strong> {err.error}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">
                    {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
                  </span>
                  <Button
                    className="gradient-primary border-0 text-white"
                    disabled={selectedContacts.length === 0 || isSendingEmails}
                    onClick={handleSendEmails}
                  >
                    {isSendingEmails ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Invitations
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Sparkles
} from "lucide-react"

type InviteMethod = "link" | "email" | "connections"

type Contact = {
  id: string
  name: string
  email: string
  avatar?: string
  selected: boolean
}

const mockContacts: Contact[] = [
  { id: "1", name: "Sarah Johnson", email: "sarah@email.com", selected: false },
  { id: "2", name: "Mike Chen", email: "mike.chen@email.com", selected: false },
  { id: "3", name: "Emma Wilson", email: "emma.w@email.com", selected: false },
  { id: "4", name: "James Rodriguez", email: "james.r@email.com", selected: false },
  { id: "5", name: "Lisa Park", email: "lisa.park@email.com", selected: false },
  { id: "6", name: "David Kim", email: "d.kim@email.com", selected: false },
  { id: "7", name: "Anna Martinez", email: "anna.m@email.com", selected: false },
  { id: "8", name: "Tom Brown", email: "tom.brown@email.com", selected: false },
]

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
  const [contacts, setContacts] = useState<Contact[]>(mockContacts)
  const [linkVisibility, setLinkVisibility] = useState<"public" | "private">("public")
  const [emailSubject, setEmailSubject] = useState("You're Invited!")
  const [emailMessage, setEmailMessage] = useState("I'd love for you to join me at this special event. Click the link below to view the invitation and RSVP.")

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
      localStorage.setItem("eventora-last-published-event-id", eventIdFromParams)
    }
  }, [eventParam, projectParam])

  useEffect(() => {
    if (resolvedEventId) {
      return
    }

    if (typeof window === "undefined") {
      return
    }

    const lastPublishedEventId = localStorage.getItem("eventora-last-published-event-id")
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

  const toggleContact = (id: string) => {
    setContacts(contacts.map(c => 
      c.id === id ? { ...c, selected: !c.selected } : c
    ))
  }

  const handleSendEmails = async () => {
    if (!emailAddresses.length || !inviteLink) return
    
    const emailsToSend = activeMethod === "connections" 
      ? contacts.filter(c => c.selected).map(c => c.email)
      : emailAddresses

    try {
      for (const email of emailsToSend) {
        const htmlEmail = `
          <p>${emailMessage.replace(/\n/g, '<br>')}</p>
          <p><a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">View Invitation</a></p>
        `
        
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: emailSubject,
            text: `${emailMessage}\n\n${inviteLink}`,
            html: htmlEmail,
            fromName: titleFromParams,
          }),
        })
      }
    } catch (error) {
      console.error('Failed to send invitations:', error)
    }
  }

  const selectedContacts = contacts.filter(c => c.selected)

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
              className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all ${
                activeMethod === method.id
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
                    className={`flex-1 flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      linkVisibility === "public"
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
                    className={`flex-1 flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      linkVisibility === "private"
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

              {/* Send button */}
              <Button 
                className="w-full gradient-primary border-0 text-white"
                disabled={emailAddresses.length === 0}
                onClick={handleSendEmails}
              >
                <Send className="w-4 h-4 mr-2" />
                Send {emailAddresses.length > 0 ? `to ${emailAddresses.length} recipient${emailAddresses.length > 1 ? 's' : ''}` : 'Invitations'}
              </Button>
            </div>
          )}

          {activeMethod === "connections" && (
            <div className="space-y-6">
              {/* Search */}
              <div>
                <label className="text-sm font-medium mb-3 block">Select from your contacts</label>
                <Input
                  placeholder="Search contacts..."
                  className="mb-4"
                />

                {/* Contacts list */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => toggleContact(contact.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        contact.selected
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-border hover:bg-card/50"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-sm font-medium">
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{contact.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{contact.email}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        contact.selected
                          ? "border-primary bg-primary"
                          : "border-border"
                      }`}>
                        {contact.selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected count and send */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <span className="text-sm text-muted-foreground">
                  {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
                </span>
                <Button 
                  className="gradient-primary border-0 text-white"
                  disabled={selectedContacts.length === 0}
                  onClick={handleSendEmails}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Invitations
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

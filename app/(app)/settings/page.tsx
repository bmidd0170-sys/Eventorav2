"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { signOut, onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { getUserNotificationSettings, saveUserNotificationSettings, type NotificationSettings } from '@/lib/notifications'
import { useToast } from '@/hooks/use-toast'
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
import { 
  User,
  Palette,
  Bell,
  Shield,
  Upload,
  Camera,
  Check,
  ChevronRight,
  Plus,
  Trash2,
  LogOut,
  Users,
  Mail,
  X
} from "lucide-react"

type Tab = "profile" | "brand" | "notifications" | "privacy" | "connections"

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "brand", label: "Brand Kit", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "connections", label: "Connections", icon: Users },
  { id: "privacy", label: "Privacy", icon: Shield },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile")

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar navigation */}
        <div className="lg:w-56 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-smooth ${
                activeTab === tab.id
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1">
          {activeTab === "profile" && <ProfileSettings />}
          {activeTab === "brand" && <BrandSettings />}
          {activeTab === "notifications" && <NotificationSettings />}
          {activeTab === "connections" && <ConnectionsSettings />}
          {activeTab === "privacy" && <PrivacySettings />}
        </div>
      </div>
    </div>
  )
}

function ProfileSettings() {
  const router = useRouter()
  const [name, setName] = useState<string>("")
  const [email, setEmail] = useState<string>("")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setName(user.displayName || user.email?.split("@")[0] || "")
        setEmail(user.email || "")
      }
    })

    return () => unsubscribe()
  }, [])

  async function handleSignOut() {
    await signOut(auth)
    router.push("/")
  }

  return (
    <div className="space-y-8">
      <section className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="text-lg font-medium mb-6">Profile Information</h2>
        
        {/* Avatar */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg hover:bg-primary/90 transition-smooth">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <p className="font-medium">Profile Photo</p>
            <p className="text-sm text-muted-foreground mb-2">JPG, PNG or GIF. Max 2MB.</p>
            <Button variant="outline" size="sm" className="border-border/50">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {/* Form fields: show logged-in user's Name and Email */}
        <div className="grid gap-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex justify-end mt-6">
            <Button className="gradient-primary border-0 text-white">
              Save Changes
            </Button>
          </div>
        </div>
      </section>
      {/* Change Password section removed per request */}

      <section className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="text-lg font-medium mb-4">Sign Out</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Sign out of your account on this device.
        </p>
        <Button
          variant="outline"
          className="border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </section>
    </div>
  )
}

function BrandSettings() {
  const [colors, setColors] = useState([
    { id: "1", name: "Primary", value: "#9333ea" },
    { id: "2", name: "Secondary", value: "#ec4899" },
    { id: "3", name: "Accent", value: "#3b82f6" },
  ])

  const [fonts, setFonts] = useState([
    { id: "1", name: "Heading", value: "Poppins" },
    { id: "2", name: "Body", value: "Inter" },
  ])

  return (
    <div className="space-y-8">
      {/* Logo */}
      <section className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="text-lg font-medium mb-4">Brand Logo</h2>
        <div className="flex items-start gap-6">
          <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center bg-secondary/50">
            <Upload className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Upload your logo to use across all invitations.
            </p>
            <p className="text-xs text-muted-foreground">
              Recommended: 512x512px, PNG or SVG
            </p>
            <Button variant="outline" size="sm" className="border-border/50 mt-2">
              <Upload className="w-4 h-4 mr-2" />
              Upload Logo
            </Button>
          </div>
        </div>
      </section>

      {/* Colors */}
      <section className="bg-card rounded-xl border border-border/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Brand Colors</h2>
          <Button variant="ghost" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Color
          </Button>
        </div>
        <div className="space-y-3">
          {colors.map((color) => (
            <div key={color.id} className="flex items-center gap-4">
              <input
                type="color"
                value={color.value}
                onChange={(e) => {
                  setColors(colors.map(c => 
                    c.id === color.id ? { ...c, value: e.target.value } : c
                  ))
                }}
                className="w-10 h-10 rounded-lg cursor-pointer border-0"
              />
              <input
                type="text"
                value={color.name}
                onChange={(e) => {
                  setColors(colors.map(c => 
                    c.id === color.id ? { ...c, name: e.target.value } : c
                  ))
                }}
                className="flex-1 bg-secondary rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <span className="text-sm text-muted-foreground font-mono w-20">{color.value}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Fonts */}
      <section className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="text-lg font-medium mb-4">Typography</h2>
        <div className="space-y-4">
          {fonts.map((font) => (
            <div key={font.id} className="flex items-center gap-4">
              <span className="w-20 text-sm text-muted-foreground">{font.name}</span>
              <select
                value={font.value}
                onChange={(e) => {
                  setFonts(fonts.map(f => 
                    f.id === font.id ? { ...f, value: e.target.value } : f
                  ))
                }}
                className="flex-1 bg-secondary rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option>Inter</option>
                <option>Poppins</option>
                <option>Playfair Display</option>
                <option>Montserrat</option>
                <option>Lora</option>
                <option>Roboto</option>
              </select>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Button className="gradient-primary border-0 text-white">
          Save Brand Kit
        </Button>
      </div>
    </div>
  )
}

function NotificationSettings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setSettings(null)
        setCurrentUserId(null)
        setLoading(false)
        return
      }
      setCurrentUserId(user.uid)
      setLoading(true)
      try {
        const s = await getUserNotificationSettings(user.uid)
        setSettings(s)
      } catch (e) {
        console.warn('Failed to load settings', e)
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  return (
    <div className="space-y-8">
      <section className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="text-lg font-medium mb-6">Email Notifications</h2>
        <div className="space-y-4">
          {loading || !settings ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              <ToggleSetting
                label="Security Alerts"
                description="Receive emails for sign-ins and security events"
                checked={settings.emailSecurity}
                onChange={(checked) => setSettings({ ...settings, emailSecurity: checked })}
              />
              <ToggleSetting
                label="RSVP Updates"
                description="Get notified when guests respond to your invitations"
                checked={settings.emailRsvp}
                onChange={(checked) => setSettings({ ...settings, emailRsvp: checked })}
              />
              <ToggleSetting
                label="Event Reminders"
                description="Receive reminders about upcoming events"
                checked={settings.emailReminders}
                onChange={(checked) => setSettings({ ...settings, emailReminders: checked })}
              />
              <ToggleSetting
                label="Product Updates"
                description="Learn about new features and improvements"
                checked={settings.emailMarketing}
                onChange={(checked) => setSettings({ ...settings, emailMarketing: checked })}
              />
              <ToggleSetting
                label="Connection Requests"
                description="Receive emails when someone sends you a connection request"
                checked={settings.emailConnectionsRequests}
                onChange={(checked) => setSettings({ ...settings, emailConnectionsRequests: checked })}
              />
              <ToggleSetting
                label="Connection Accepted"
                description="Receive an email when a connection request is accepted"
                checked={settings.emailConnectionsAccepted}
                onChange={(checked) => setSettings({ ...settings, emailConnectionsAccepted: checked })}
              />
            </>
          )}
        </div>
      </section>

      <section className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="text-lg font-medium mb-6">Push Notifications</h2>
        <div className="space-y-4">
          {loading || !settings ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              <ToggleSetting
                label="RSVP Alerts"
                description="Instant notifications for new RSVPs"
                checked={settings.pushRsvp}
                onChange={(checked) => setSettings({ ...settings, pushRsvp: checked })}
              />
              <ToggleSetting
                label="Reminder Alerts"
                description="Push notifications for event reminders"
                checked={settings.pushReminders}
                onChange={(checked) => setSettings({ ...settings, pushReminders: checked })}
              />
              <ToggleSetting
                label="Tips & Suggestions"
                description="Helpful tips to improve your invitations"
                checked={settings.pushTips}
                onChange={(checked) => setSettings({ ...settings, pushTips: checked })}
              />
              <ToggleSetting
                label="Connection Requests"
                description="Push notifications when someone sends you a connection request"
                checked={settings.pushConnectionsRequests}
                onChange={(checked) => setSettings({ ...settings, pushConnectionsRequests: checked })}
              />
              <ToggleSetting
                label="Connection Accepted"
                description="Push notification when your connection request is accepted"
                checked={settings.pushConnectionsAccepted}
                onChange={(checked) => setSettings({ ...settings, pushConnectionsAccepted: checked })}
              />
            </>
          )}
        </div>
      </section>
      <div className="flex justify-end mt-4">
        <Button
          className="gradient-primary border-0 text-white"
          disabled={loading || !settings || saving}
          onClick={async () => {
            console.log('Save notification settings clicked', { currentUserId, settings })
            if (!currentUserId || !settings) {
              toast({ title: 'Error', description: 'You must be signed in to save settings', variant: 'destructive' })
              return
            }
            setSaving(true)
            toast({ title: 'Saving', description: 'Saving notification settings...' })
            try {
              await saveUserNotificationSettings(currentUserId, settings)
              toast({ title: 'Saved', description: 'Notification settings saved' })
            } catch (e) {
              console.error('Failed to save settings', e)
              toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' })
            } finally {
              setSaving(false)
            }
          }}
        >
          {saving ? 'Saving…' : 'Save Notification Settings'}
        </Button>
      </div>
    </div>
  )
}

function ConnectionsSettings() {
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
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error("Error sending connection request:", err)
      setError("Failed to send connection request. Please try again.")
    } finally {
      setSendingRequest(false)
    }
  }

  return (
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
      <section className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="text-lg font-medium mb-4">Connection Requests ({pendingRequests.length})</h2>
        {pendingRequests.length > 0 ? (
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
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="font-medium">No pending connection requests</p>
            <p className="text-sm mt-1">When someone sends you a request, it will appear here.</p>
          </div>
        )}
      </section>

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
  )
}

function PrivacySettings() {
  const [settings, setSettings] = useState({
    profilePublic: false,
    showActivity: true,
    allowAnalytics: true,
    // twoFactor removed per request
  })

  return (
    <div className="space-y-8">
      <section className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="text-lg font-medium mb-6">Privacy</h2>
        <div className="space-y-4">
          <ToggleSetting
            label="Public Profile"
            description="Allow others to view your profile and public events"
            checked={settings.profilePublic}
            onChange={(checked) => setSettings({ ...settings, profilePublic: checked })}
          />
          <ToggleSetting
            label="Activity Status"
            description="Show when you are online or recently active"
            checked={settings.showActivity}
            onChange={(checked) => setSettings({ ...settings, showActivity: checked })}
          />
          <ToggleSetting
            label="Analytics"
            description="Help us improve by sharing anonymous usage data"
            checked={settings.allowAnalytics}
            onChange={(checked) => setSettings({ ...settings, allowAnalytics: checked })}
          />
        </div>
      </section>

      <section className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="text-lg font-medium mb-6">Security</h2>
        <div className="space-y-4">
          {/* Two-Factor and Active Sessions removed per request */}

          <div className="pt-4 border-t border-border/50">
            <button className="flex items-center justify-between w-full py-2 text-left group">
              <div>
                <p className="font-medium text-destructive">Delete Account</p>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-destructive transition-smooth" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

// Password input removed (change-password UI deleted)

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-secondary"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}

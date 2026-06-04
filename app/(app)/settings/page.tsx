"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signOut,
} from "firebase/auth"
import { auth } from "@/lib/auth/client"
import { fetchWithAuth } from "@/lib/api-client"
import { getUserNotificationSettings, saveUserNotificationSettings } from '@/lib/notifications'
import { getCurrentUserProfile, saveCurrentUserProfile } from "@/lib/profile"
import { type NotificationSettings } from "@/lib/notification-settings"
import { getUserBranding, type BrandSettings as BrandKitSettings } from "@/lib/branding"
import { useBrand } from "@/components/brand/brand-provider"
import { useToast } from '@/hooks/use-toast'
import { useConnectionsManager } from "@/components/connections/use-connections-manager"
import { Input } from "@/components/ui/input"
import { 
  User,
  Palette,
  Bell,
  Shield,
  Upload,
  Camera,
  ChevronRight,
  Trash2,
  LogOut,
  Users,
  Mail,
  Check,
  X,
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
  const { toast } = useToast()
  const [name, setName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false)
        return
      }

      setEmail(user.email || "")

      try {
        const profile = await getCurrentUserProfile()
        setName(profile.displayName || user.displayName || user.email?.split("@")[0] || "")
        setPhotoUrl(profile.photoUrl || null)
      } catch {
        setName(user.displayName || user.email?.split("@")[0] || "")
      } finally {
        setLoading(false)
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
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg hover:bg-primary/90 transition-smooth"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                if (file.size > 2 * 1024 * 1024) {
                  toast({ title: "Error", description: "Image must be under 2MB", variant: "destructive" })
                  return
                }

                const reader = new FileReader()
                reader.onload = async (ev) => {
                  const dataUrl = ev.target?.result as string
                  setPhotoUrl(dataUrl)
                  try {
                    setSaving(true)
                    await saveCurrentUserProfile({ photoUrl: dataUrl })
                    toast({ title: "Saved", description: "Profile photo updated" })
                  } catch (err) {
                    console.error('Failed to upload profile photo', err)
                    toast({ title: "Error", description: "Failed to save profile photo", variant: "destructive" })
                  } finally {
                    setSaving(false)
                  }
                }
                reader.readAsDataURL(file)
                e.currentTarget.value = ''
              }}
            />
          </div>
          <div>
            <p className="font-medium">Profile Photo</p>
            <p className="text-sm text-muted-foreground mb-2">JPG, PNG or GIF. Max 2MB.</p>

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
              readOnly
              className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm opacity-80"
            />
          </div>

          <div className="flex justify-end mt-6">
            <Button
              className="gradient-primary border-0 text-white"
              disabled={loading || saving}
              onClick={async () => {
                if (saving) {
                  return
                }

                setSaving(true)
                try {
                  await saveCurrentUserProfile({ displayName: name })
                  toast({ title: "Saved", description: "Profile updated in Neon" })
                } catch (error) {
                  console.error("Failed to save profile", error)
                  toast({ title: "Error", description: "Failed to save profile", variant: "destructive" })
                } finally {
                  setSaving(false)
                }
              }}
            >
              {saving ? "Saving…" : "Save Changes"}
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
  const { toast } = useToast()
  const { setBrand } = useBrand()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined)
  const [colors, setColors] = useState([
    { id: "1", name: "Primary", value: "#9333ea" },
    { id: "2", name: "Secondary", value: "#ec4899" },
    { id: "3", name: "Accent", value: "#3b82f6" },
  ])

  const [fonts, setFonts] = useState([
    { id: "1", name: "Heading", value: "Poppins" },
    { id: "2", name: "Body", value: "Inter" },
  ])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUserId(null)
        setLoading(false)
        return
      }

      setCurrentUserId(user.uid)
      setLoading(true)

      try {
        const brand = await getUserBranding(user.uid)
        setLogoDataUrl(brand.logoDataUrl)
        setColors([
          { id: "1", name: "Primary", value: brand.primaryColor || "#9333ea" },
          { id: "2", name: "Secondary", value: brand.secondaryColor || "#ec4899" },
          { id: "3", name: "Accent", value: brand.accentColor || "#3b82f6" },
        ])
        setFonts([
          { id: "1", name: "Heading", value: brand.headingFont || "Poppins" },
          { id: "2", name: "Body", value: brand.bodyFont || "Inter" },
        ])
      } catch (error) {
        console.warn("Failed to load brand settings", error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleSaveBrandKit = async () => {
    if (!currentUserId) {
      toast({
        title: "Error",
        description: "You must be signed in to save your brand kit",
        variant: "destructive",
      })
      return
    }

    const nextBrand: BrandKitSettings = {
      primaryColor: colors[0]?.value,
      secondaryColor: colors[1]?.value,
      accentColor: colors[2]?.value,
      headingFont: fonts.find((font) => font.name === "Heading")?.value,
      bodyFont: fonts.find((font) => font.name === "Body")?.value,
    }

    setSaving(true)
    try {
      await setBrand(nextBrand)
      toast({ title: "Saved", description: "Brand kit saved" })
    } catch (error) {
      console.error("Failed to save brand kit", error)
      toast({
        title: "Error",
        description: "Failed to save brand kit",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Logo */}
      <section className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="text-lg font-medium mb-4">Brand Logo</h2>
        <div className="flex items-start gap-6">
          <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center bg-secondary/50 overflow-hidden">
            {logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoDataUrl} alt="Logo" className="w-full h-full object-contain p-2 bg-white" />
            ) : (
              <Upload className="w-8 h-8 text-muted-foreground" />
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*,image/svg+xml"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = async (ev) => {
                  const dataUrl = ev.target?.result as string
                  setLogoDataUrl(dataUrl)
                  try {
                    setSaving(true)
                    await setBrand({ logoDataUrl: dataUrl })
                    toast({ title: "Saved", description: "Logo uploaded" })
                  } catch (err) {
                    console.error('Failed to save logo', err)
                    toast({ title: "Error", description: "Failed to save logo", variant: "destructive" })
                  } finally {
                    setSaving(false)
                  }
                }
                reader.readAsDataURL(file)
                e.currentTarget.value = ''
              }}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Upload your logo to use across all invitations.
            </p>
            <p className="text-xs text-muted-foreground">
              Recommended: 512x512px, PNG or SVG
            </p>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border/50"
                onClick={() => logoInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  setLogoDataUrl(undefined)
                  try {
                    setSaving(true)
                    await setBrand({ logoDataUrl: undefined })
                    toast({ title: "Removed", description: "Logo removed" })
                  } catch (err) {
                    console.error('Failed to remove logo', err)
                    toast({ title: "Error", description: "Failed to remove logo", variant: "destructive" })
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Colors */}
      <section className="bg-card rounded-xl border border-border/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Brand Colors</h2>
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
              <div className="flex-1 bg-secondary rounded-lg px-4 py-2 text-sm text-foreground">
                {color.name}
              </div>
              <span className="text-sm text-muted-foreground font-mono w-20">{color.value}</span>
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
        <Button
          className="gradient-primary border-0 text-white"
          disabled={loading || saving}
          onClick={handleSaveBrandKit}
        >
          {saving ? "Saving…" : "Save Brand Kit"}
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
  const {
    connections,
    pendingRequests,
    outgoingRequests,
    loadingConnections,
    loadingRequests,
    loadingOutgoingRequests,
    error,
    currentUserId,
    handleRemoveConnection,
    handleBlockUser,
    handleAcceptRequest,
    handleRejectRequest,
    refreshPendingRequests,
    refreshOutgoingRequests,
  } = useConnectionsManager({ includeOutgoingRequests: true })

  useEffect(() => {
    if (!currentUserId) {
      return
    }

    const interval = window.setInterval(() => {
      void refreshPendingRequests()
      void refreshOutgoingRequests()
    }, 15000)

    return () => window.clearInterval(interval)
  }, [currentUserId, refreshOutgoingRequests, refreshPendingRequests])

  const hasRequests = pendingRequests.length > 0 || outgoingRequests.length > 0
  const incomingLoading = loadingRequests
  const outgoingLoading = loadingOutgoingRequests

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-border/50 bg-card p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">Connection Requests</h2>
            <p className="text-sm text-muted-foreground">Pending requests you received or sent</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Incoming ({pendingRequests.length})</h3>
            </div>
            {incomingLoading ? (
              <p className="py-4 text-sm text-muted-foreground">Loading incoming requests...</p>
            ) : pendingRequests.length > 0 ? (
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
                      <Button size="sm" variant="outline" className="border-border/50" onClick={() => handleRejectRequest(request.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No incoming requests.</p>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Outgoing ({outgoingRequests.length})</h3>
            </div>
            {outgoingLoading ? (
              <p className="py-4 text-sm text-muted-foreground">Loading outgoing requests...</p>
            ) : outgoingRequests.length > 0 ? (
              <div className="space-y-3">
                {outgoingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{request.fromUserName}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        Sent to {request.toUserName || request.toUserEmail || request.toUserId}
                      </p>
                    </div>
                    <div className="ml-4 rounded-full border border-border/50 px-3 py-1 text-xs text-muted-foreground">
                      Pending
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No outgoing requests.</p>
            )}
          </div>
        </div>
      </section>

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
                <div className="ml-4 flex flex-shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveConnection(connection.id, connection.connectedUserId)}
                  >
                    <Trash2 className="h-4 w-4" />
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
    </div>
  )
}

function PrivacySettings() {
  const router = useRouter()
  const { toast } = useToast()
  const recentLoginWindowMs = 5 * 60 * 1000
  const [settings, setSettings] = useState({
    profilePublic: false,
    showActivity: true,
    allowAnalytics: true,
    // twoFactor removed per request
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reauthDialogOpen, setReauthDialogOpen] = useState(false)
  const [reauthPassword, setReauthPassword] = useState("")
  const [reauthError, setReauthError] = useState<string | null>(null)
  const [reauthLoading, setReauthLoading] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  function isRecentLoginError(error: unknown) {
    return error instanceof Error && error.message.includes("auth/requires-recent-login")
  }

  function needsReauthentication() {
    const currentUser = auth.currentUser
    if (!currentUser?.metadata.lastSignInTime) {
      return true
    }

    const lastSignInAt = new Date(currentUser.metadata.lastSignInTime).getTime()
    if (Number.isNaN(lastSignInAt)) {
      return true
    }

    return Date.now() - lastSignInAt > recentLoginWindowMs
  }

  async function deleteFirebaseUser() {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("No authenticated user found")
    }

    await currentUser.delete()
  }

  async function retryDeleteAccountAfterReauth() {
    try {
      setReauthLoading(true)
      setReauthError(null)

      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error("No authenticated user found")
      }

      const usesGoogle = currentUser.providerData.some((provider) => provider.providerId === "google.com")

      if (usesGoogle) {
        const provider = new GoogleAuthProvider()
        await reauthenticateWithPopup(currentUser, provider)
      } else {
        if (!reauthPassword.trim()) {
          throw new Error("Enter your password to continue")
        }

        if (!currentUser.email) {
          throw new Error("Your account does not have an email address for password reauthentication")
        }

        const credential = EmailAuthProvider.credential(currentUser.email, reauthPassword)
        await reauthenticateWithCredential(currentUser, credential)
      }

      await deleteFirebaseUser()
      await signOut(auth)
      setReauthDialogOpen(false)
      setDeleteDialogOpen(false)
      setReauthPassword("")
      toast({
        title: "Account deleted",
        description: "Your account and stored data have been removed.",
      })
      router.push("/")
    } catch (error) {
      console.error("Failed to delete account after reauth", error)
      setReauthError(error instanceof Error ? error.message : "Unable to reauthenticate right now.")
    } finally {
      setReauthLoading(false)
    }
  }

  async function handleDeleteAccount() {
    if (deletingAccount) {
      return
    }

    setDeletingAccount(true)

    try {
      const response = await fetchWithAuth("/api/account/delete", {
        method: "POST",
      })

      if (!response.ok) {
        let message = "Failed to delete account"

        try {
          const payload = await response.json()
          if (typeof payload?.error === "string") {
            message = payload.error
          }
        } catch {
          // Keep the default message when the response is not JSON.
        }

        throw new Error(message)
      }

      const payload = (await response.json().catch(() => null)) as { firebaseAuthDeletionSkipped?: boolean } | null

      if (payload?.firebaseAuthDeletionSkipped) {
        if (needsReauthentication()) {
          setReauthPassword("")
          setReauthError(null)
          setReauthDialogOpen(true)
          return
        }

        try {
          await deleteFirebaseUser()
        } catch (error) {
          if (isRecentLoginError(error)) {
            setReauthPassword("")
            setReauthError(null)
            setReauthDialogOpen(true)
            return
          }

          throw error
        }
      }

      await signOut(auth)
      setDeleteDialogOpen(false)
      toast({
        title: "Account deleted",
        description: "Your account and stored data have been removed.",
      })
      router.push("/")
    } catch (error) {
      console.error("Failed to delete account", error)
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Unable to delete your account right now.",
        variant: "destructive",
      })
    } finally {
      setDeletingAccount(false)
    }
  }

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
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <button className="flex items-center justify-between w-full py-2 text-left group">
                  <div>
                    <p className="font-medium text-destructive">Delete Account</p>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-destructive transition-smooth" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove your account and associated data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingAccount}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(event) => {
                      event.preventDefault()
                      void handleDeleteAccount()
                    }}
                    disabled={deletingAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deletingAccount ? "Deleting…" : "Delete Account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={reauthDialogOpen} onOpenChange={setReauthDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reauthenticate to delete your account</AlertDialogTitle>
                  <AlertDialogDescription>
                    Firebase needs to confirm it is really you before the account can be removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                  {auth.currentUser?.providerData.some((provider) => provider.providerId === "google.com") ? (
                    <p className="text-sm text-muted-foreground">
                      Continue with Google to confirm the deletion.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password</label>
                      <Input
                        type="password"
                        value={reauthPassword}
                        onChange={(event) => setReauthPassword(event.target.value)}
                        placeholder="Enter your password"
                        disabled={reauthLoading}
                      />
                    </div>
                  )}
                  {reauthError ? <p className="text-sm text-destructive">{reauthError}</p> : null}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={reauthLoading}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(event) => {
                      event.preventDefault()
                      void retryDeleteAccountAfterReauth()
                    }}
                    disabled={reauthLoading}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {reauthLoading ? "Confirming…" : "Confirm Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
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
  Eye,
  EyeOff,
  LogOut
} from "lucide-react"

type Tab = "profile" | "brand" | "notifications" | "privacy"

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "brand", label: "Brand Kit", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
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
          {activeTab === "privacy" && <PrivacySettings />}
        </div>
      </div>
    </div>
  )
}

function ProfileSettings() {
  const router = useRouter()

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

        {/* Form fields */}
        <div className="grid gap-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">First Name</label>
              <input
                type="text"
                defaultValue="Sarah"
                className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Last Name</label>
              <input
                type="text"
                defaultValue="Johnson"
                className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Email</label>
            <input
              type="email"
              defaultValue="sarah@example.com"
              className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Bio</label>
            <textarea
              rows={3}
              defaultValue="Event planner and creative enthusiast."
              className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button className="gradient-primary border-0 text-white">
            Save Changes
          </Button>
        </div>
      </section>

      <section className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="text-lg font-medium mb-4">Change Password</h2>
        <div className="grid gap-4 max-w-md">
          <PasswordInput label="Current Password" />
          <PasswordInput label="New Password" />
          <PasswordInput label="Confirm New Password" />
        </div>
        <div className="flex justify-end mt-6">
          <Button variant="outline" className="border-border/50">
            Update Password
          </Button>
        </div>
      </section>

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
  const [settings, setSettings] = useState({
    emailRsvp: true,
    emailReminders: true,
    emailMarketing: false,
    pushRsvp: true,
    pushReminders: true,
    pushTips: false,
  })

  return (
    <div className="space-y-8">
      <section className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="text-lg font-medium mb-6">Email Notifications</h2>
        <div className="space-y-4">
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
        </div>
      </section>

      <section className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="text-lg font-medium mb-6">Push Notifications</h2>
        <div className="space-y-4">
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
        </div>
      </section>
    </div>
  )
}

function PrivacySettings() {
  const [settings, setSettings] = useState({
    profilePublic: false,
    showActivity: true,
    allowAnalytics: true,
    twoFactor: false,
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
          <ToggleSetting
            label="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
            checked={settings.twoFactor}
            onChange={(checked) => setSettings({ ...settings, twoFactor: checked })}
          />

          <div className="pt-4 border-t border-border/50">
            <button className="flex items-center justify-between w-full py-2 text-left group">
              <div>
                <p className="font-medium">Active Sessions</p>
                <p className="text-sm text-muted-foreground">Manage devices where you are logged in</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-smooth" />
            </button>
          </div>

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

function PasswordInput({ label }: { label: string }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">{label}</label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          className="w-full bg-secondary rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

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

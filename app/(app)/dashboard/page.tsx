"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { type InvitationSummary } from "@/lib/invitations"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import {
  Plus,
  Calendar,
  Users,
  Mail,
  Clock,
  MoreHorizontal,
  Eye,
  Edit3,
  Trash2,
  Filter,
  Search
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">("all")
  const [reminderFilter, setReminderFilter] = useState<"all" | "on" | "off">("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteDialogTargets, setDeleteDialogTargets] = useState<InvitationSummary[]>([])
  const [bulkMode, setBulkMode] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // initialize from URL params on mount
    const params = Object.fromEntries(searchParams?.entries() ?? []) as Record<string, string>
    if (params.status) setStatusFilter(params.status as any)
    if (params.reminder) setReminderFilter(params.reminder as any)
    if (params.startDate) setStartDate(params.startDate)
    if (params.endDate) setEndDate(params.endDate)
    if (params.q) setSearchQuery(params.q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const res = await fetch("/api/events/list", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.events)) setEvents(data.events)
        }
      } catch (err) {
        console.error("Failed to fetch events:", err)
      }
    })
    return () => unsubscribe()
  }, [])

  function updateUrlParams(opts: { status?: string; reminder?: string; startDate?: string; endDate?: string; q?: string }) {
    const params = new URLSearchParams()
    const s = opts.status ?? statusFilter
    const r = opts.reminder ?? reminderFilter
    const sd = opts.startDate ?? startDate
    const ed = opts.endDate ?? endDate
    const q = opts.q ?? searchQuery

    if (s && s !== "all") params.set("status", s)
    if (r && r !== "all") params.set("reminder", r)
    if (sd) params.set("startDate", sd)
    if (ed) params.set("endDate", ed)
    if (q) params.set("q", q)

    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  const [events, setEvents] = useState<InvitationSummary[]>([])

  const dashboardStats = [
    {
      label: "Total Events",
      value: events.length.toString(),
      icon: Calendar,
      color: "text-primary",
    },
    {
      label: "Total Guests",
      value: events.reduce((total, event) => total + event.guests.total, 0).toString(),
      icon: Users,
      color: "text-accent",
    },
    {
      label: "Responses",
      value: events.reduce((total, event) => total + event.guests.confirmed, 0).toString(),
      icon: Mail,
      color: "text-chart-3",
    },
    {
      label: "Upcoming",
      value: events.filter(event => event.status === "active").length.toString(),
      icon: Clock,
      color: "text-chart-4",
    },
  ]

  const selectedCount = selectedEventIds.length
  const selectedEvents = events.filter(event => selectedEventIds.includes(event.id))

  const toggleSelectedEvent = (eventId: string, checked: boolean) => {
    setSelectedEventIds(prev => {
      if (checked) return prev.includes(eventId) ? prev : [...prev, eventId]
      return prev.filter(id => id !== eventId)
    })
  }

  const openDeleteDialog = (targets: InvitationSummary[]) => {
    setDeleteDialogTargets(targets)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirmed = async () => {
    if (deleteDialogTargets.length === 0 || deletingEventId) return

    try {
      setDeletingEventId(deleteDialogTargets.length === 1 ? deleteDialogTargets[0].id : "bulk")

      const user = auth.currentUser
      if (!user) throw new Error("You must be signed in to delete invitations.")

      const token = await user.getIdToken()
      const response = await fetch("/api/events/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventIds: deleteDialogTargets.map(event => event.id),
        }),
      })

      if (!response.ok) {
        throw new Error("Delete failed")
      }

      const deletedIds = new Set(deleteDialogTargets.map(event => event.id))
      setEvents(prev => prev.filter(event => !deletedIds.has(event.id)))
      setSelectedEventIds(prev => prev.filter(id => !deletedIds.has(id)))
      setBulkMode(false)
      setDeleteDialogOpen(false)
      setDeleteDialogTargets([])
    } catch (error) {
      console.error("Failed to delete event(s):", error)
    } finally {
      setDeletingEventId(null)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    const event = events.find(item => item.id === eventId)
    if (!event) return
    openDeleteDialog([event])
  }

  const handleBulkDelete = () => {
    openDeleteDialog(selectedEvents)
  }

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === "all" ? true : event.status === statusFilter
    const matchesReminder =
      reminderFilter === "all"
        ? true
        : reminderFilter === "on"
          ? !!event.reminder
          : !event.reminder

    // date filtering: parse event.date with current year
    let matchesDate = true
    if (startDate || endDate) {
      const year = new Date().getFullYear()
      const parsed = Date.parse(`${event.date} ${year}`)
      if (!isNaN(parsed)) {
        const eventTs = parsed
        if (startDate) {
          const sd = Date.parse(startDate)
          if (!isNaN(sd) && eventTs < sd) matchesDate = false
        }
        if (endDate) {
          const ed = Date.parse(endDate)
          if (!isNaN(ed) && eventTs > ed) matchesDate = false
        }
      }
    }

    return matchesSearch && matchesStatus && matchesReminder && matchesDate
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Manage your events and track responses</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {dashboardStats.map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="mb-8 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">No invitations yet</p>
              <h2 className="text-xl font-semibold">Create your first event to start building the guest experience.</h2>
              <p className="text-sm text-muted-foreground">
                Once you create an invitation, this message disappears and your dashboard updates with live event data.
              </p>
            </div>
            <Button className="gradient-primary border-0 text-white" asChild>
              <Link href="/builder">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="border-border/50">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-xs font-medium mb-2">Status</p>
              <RadioGroup
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as "all" | "active" | "draft")
                  updateUrlParams({ status: v })
                }}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="all" />
                  <span className="text-sm">All</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <RadioGroupItem value="active" />
                  <span className="text-sm">Active</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <RadioGroupItem value="draft" />
                  <span className="text-sm">Draft</span>
                </div>
              </RadioGroup>
            </div>

            <div className="px-3 py-2">
              <p className="text-xs font-medium mb-2">Reminders</p>
              <RadioGroup
                value={reminderFilter}
                onValueChange={(v) => {
                  setReminderFilter(v as "all" | "on" | "off")
                  updateUrlParams({ reminder: v })
                }}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="all" />
                  <span className="text-sm">All</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <RadioGroupItem value="on" />
                  <span className="text-sm">On</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <RadioGroupItem value="off" />
                  <span className="text-sm">Off</span>
                </div>
              </RadioGroup>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant={bulkMode ? "secondary" : "outline"}
            size="sm"
            className="border-border/50"
            onClick={() => {
              setBulkMode(prev => !prev)
              if (bulkMode) setSelectedEventIds([])
            }}
          >
            {bulkMode ? "Done" : "Select"}
          </Button>
          {selectedCount > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={!!deletingEventId}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete {selectedCount}
            </Button>
          )}
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border-border/60 bg-card/95 backdrop-blur-xl sm:max-w-lg">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-rose-500" />
          <DialogHeader className="pt-2 text-left">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl">
              Delete {deleteDialogTargets.length > 1 ? `${deleteDialogTargets.length} invitations` : "invitation"}?
            </DialogTitle>
            <DialogDescription className="text-sm leading-6">
              This will permanently remove {deleteDialogTargets.length > 1 ? "these invitations" : "this invitation"} and all related data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 rounded-xl border border-border/60 bg-secondary/40 p-3">
            {deleteDialogTargets.slice(0, 4).map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{event.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{event.date} · {event.time}</p>
                </div>
                <span className="rounded-md bg-background/70 px-2 py-1 text-xs text-muted-foreground">
                  {event.status}
                </span>
              </div>
            ))}
            {deleteDialogTargets.length > 4 && (
              <p className="text-xs text-muted-foreground">
                +{deleteDialogTargets.length - 4} more
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={!!deletingEventId}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirmed} disabled={!!deletingEventId}>
              <Trash2 className="mr-2 h-4 w-4" />
              {deletingEventId ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Events grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onDelete={handleDeleteEvent}
              isDeleting={deletingEventId === event.id}
              bulkMode={bulkMode}
              selected={selectedEventIds.includes(event.id)}
              onSelectChange={toggleSelectedEvent}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/60 bg-secondary/20 p-10 text-center">
          <p className="text-lg font-medium">No invitations match your filters.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting the filters, or create a new event to populate this dashboard.
          </p>
        </div>
      )}
    </div>
  )
}

function EventCard({
  event,
  onDelete,
  isDeleting,
  bulkMode,
  selected,
  onSelectChange,
}: {
  event: InvitationSummary
  onDelete: (eventId: string) => void
  isDeleting: boolean
  bulkMode: boolean
  selected: boolean
  onSelectChange: (eventId: string, checked: boolean) => void
}) {
  const confirmRate = Math.round((event.guests.confirmed / event.guests.total) * 100)

  return (
    <div className={`group bg-card rounded-2xl border overflow-hidden hover:border-primary/30 transition-smooth ${selected ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary))]" : "border-border/50"}`}>
      {/* Preview area */}
      <div className={`relative h-32 bg-gradient-to-br ${event.color}`}>
        {bulkMode && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-background/90 p-1 shadow-sm backdrop-blur">
            <Checkbox checked={selected} onCheckedChange={(checked) => onSelectChange(event.id, checked === true)} />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <Calendar className="w-12 h-12 text-muted-foreground/30" />
        </div>
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${event.status === "active"
            ? "bg-accent/20 text-accent"
            : "bg-muted text-muted-foreground"
            }`}>
            {event.status === "active" ? "Active" : "Draft"}
          </span>
        </div>
        {/* Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-smooth">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/preview?event=${event.id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/editor?event=${event.id}`}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                disabled={isDeleting}
                onSelect={(e) => {
                  e.preventDefault()
                  void onDelete(event.id)
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-medium truncate">{event.title}</h3>
          <p className="text-sm text-muted-foreground truncate">{event.description}</p>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {event.date}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {event.time}
          </div>
        </div>

        {/* RSVP progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">RSVPs</span>
            <span className="font-medium">{event.guests.confirmed}/{event.guests.total}</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full gradient-primary rounded-full transition-all duration-500"
              style={{ width: `${confirmRate}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className={`w-3.5 h-3.5 ${event.reminder ? 'text-accent' : ''}`} />
            {event.reminder ? "Reminders on" : "Reminders off"}
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/guest-list/${event.id}`}>
              Manage
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

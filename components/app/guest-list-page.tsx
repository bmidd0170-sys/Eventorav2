"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Bell,
    Calendar,
    Check,
    ChevronDown,
    Clock,
    Download,
    Edit3,
    Filter,
    Mail,
    MoreHorizontal,
    Search,
    Send,
    Trash2,
    Upload,
    Users,
    X,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { InvitationSummary } from "@/lib/invitations"
import type { Guest } from "@/lib/guest-lists"

export function GuestListPage({ invitation, guests }: { invitation: InvitationSummary; guests: Guest[] }) {
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [selectedGuests, setSelectedGuests] = useState<string[]>([])
    const [eventDate, setEventDate] = useState(invitation.date)
    const [eventTime, setEventTime] = useState(invitation.time)
    const [isEditingSchedule, setIsEditingSchedule] = useState(false)

    const daysUntilEvent = getDaysUntilEvent(eventDate)
    const confirmed = guests.filter((guest) => guest.status === "confirmed").length
    const pending = guests.filter((guest) => guest.status === "pending").length
    const declined = guests.filter((guest) => guest.status === "declined").length

    const filteredGuests = guests.filter((guest) => {
        const matchesSearch =
            guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            guest.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "all" || guest.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const toggleSelectGuest = (id: string) => {
        setSelectedGuests((previous) =>
            previous.includes(id) ? previous.filter((guestId) => guestId !== id) : [...previous, id],
        )
    }

    const toggleSelectAll = () => {
        if (selectedGuests.length === filteredGuests.length) {
            setSelectedGuests([])
        } else {
            setSelectedGuests(filteredGuests.map((guest) => guest.id))
        }
    }

    return (
        <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 via-accent/5 to-transparent" />
            <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-primary/15 blur-[120px]" />
            <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-accent/10 blur-[120px]" />

            <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                    Guest list
                </div>

                <div className="mb-8 rounded-2xl border border-border/60 bg-card/90 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl lg:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{invitation.title}</h1>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-3 py-1">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    {eventDate}
                                </span>
                                <span className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-3 py-1">
                                    <Clock className="w-4 h-4 text-accent" />
                                    {eventTime}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 rounded-full border border-border/60 bg-background/30 px-3 text-xs hover:bg-secondary"
                                    onClick={() => setIsEditingSchedule((previous) => !previous)}
                                >
                                    {isEditingSchedule ? "Done" : "Edit schedule"}
                                </Button>
                            </div>

                            {isEditingSchedule && (
                                <div className="mt-4 flex max-w-2xl flex-col gap-3 sm:flex-row">
                                    <label className="flex-1 space-y-1.5">
                                        <span className="text-xs text-muted-foreground">Event date</span>
                                        <input
                                            type="text"
                                            value={eventDate}
                                            onChange={(event) => setEventDate(event.target.value)}
                                            className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            placeholder="May 20"
                                        />
                                    </label>
                                    <label className="flex-1 space-y-1.5">
                                        <span className="text-xs text-muted-foreground">Event time</span>
                                        <input
                                            type="text"
                                            value={eventTime}
                                            onChange={(event) => setEventTime(event.target.value)}
                                            className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            placeholder="7:00 PM"
                                        />
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-6 rounded-2xl border border-border/60 bg-background/50 px-5 py-4 shadow-lg">
                            <div className="min-w-24 text-center">
                                <p className="text-4xl font-semibold gradient-text">{daysUntilEvent}</p>
                                <p className="text-xs text-muted-foreground">
                                    {Number(daysUntilEvent) === 1 ? "day until event" : "days until event"}
                                </p>
                            </div>
                            <div className="h-14 w-px bg-border/80" />
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="h-2 w-2 rounded-full bg-accent" />
                                    <span className="text-muted-foreground">{confirmed} confirmed</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="h-2 w-2 rounded-full bg-chart-4" />
                                    <span className="text-muted-foreground">{pending} pending</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="h-2 w-2 rounded-full bg-destructive" />
                                    <span className="text-muted-foreground">{declined} declined</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard label="Total Invited" value={guests.length.toString()} icon={Users} color="text-primary" />
                    <StatCard
                        label="Confirmed"
                        value={confirmed.toString()}
                        icon={Check}
                        color="text-accent"
                        subtext={`${Math.round((confirmed / guests.length) * 100)}% response rate`}
                    />
                    <StatCard label="Pending" value={pending.toString()} icon={Clock} color="text-chart-4" />
                    <StatCard
                        label="Plus Ones"
                        value={guests.filter((guest) => guest.plusOne && guest.status === "confirmed").length.toString()}
                        icon={Users}
                        color="text-chart-3"
                    />
                </div>

                <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search guests..."
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            className="w-full rounded-xl border border-border/60 bg-card/70 py-2.5 pl-10 pr-4 text-sm shadow-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="rounded-xl border-border/60 bg-card/70 backdrop-blur hover:bg-secondary">
                                    <Filter className="mr-2 h-4 w-4" />
                                    {statusFilter === "all" ? "All Status" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Status</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("confirmed")}>Confirmed</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("pending")}>Pending</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("declined")}>Declined</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="outline" size="sm" className="rounded-xl border-border/60 bg-card/70 backdrop-blur hover:bg-secondary">
                            <Upload className="mr-2 h-4 w-4" />
                            Import CSV
                        </Button>

                        <Button size="sm" className="rounded-xl border-0 bg-gradient-to-r from-primary via-accent to-chart-3 text-white shadow-lg shadow-primary/20">
                            <Bell className="mr-2 h-4 w-4" />
                            Send Reminders
                        </Button>
                    </div>
                </div>

                {selectedGuests.length > 0 && (
                    <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 backdrop-blur">
                        <span className="text-sm font-medium">{selectedGuests.length} selected</span>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="ghost" size="sm" className="rounded-xl">
                                <Send className="mr-1 h-4 w-4" />
                                Email
                            </Button>
                            <Button variant="ghost" size="sm" className="rounded-xl">
                                <Download className="mr-1 h-4 w-4" />
                                Export
                            </Button>
                            <Button variant="ghost" size="sm" className="rounded-xl text-destructive">
                                <Trash2 className="mr-1 h-4 w-4" />
                                Remove
                            </Button>
                        </div>
                    </div>
                )}

                <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-2xl shadow-black/20 backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border/60 bg-secondary/50">
                                    <th className="w-12 p-4 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedGuests.length === filteredGuests.length && filteredGuests.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded border-border bg-background"
                                        />
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Guest</th>
                                    <th className="hidden p-4 text-left text-sm font-medium text-muted-foreground md:table-cell">Contact</th>
                                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                                    <th className="hidden p-4 text-left text-sm font-medium text-muted-foreground lg:table-cell">Plus One</th>
                                    <th className="hidden p-4 text-left text-sm font-medium text-muted-foreground lg:table-cell">Notes</th>
                                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredGuests.map((guest) => (
                                    <tr key={guest.id} className="border-b border-border/50 last:border-0 transition-smooth hover:bg-secondary/30">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedGuests.includes(guest.id)}
                                                onChange={() => toggleSelectGuest(guest.id)}
                                                className="rounded border-border bg-background"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <p className="font-medium">{guest.name}</p>
                                            <p className="text-sm text-muted-foreground md:hidden">{guest.email}</p>
                                        </td>
                                        <td className="hidden p-4 md:table-cell">
                                            <div className="text-sm">
                                                <p>{guest.email}</p>
                                                {guest.phone && <p className="text-muted-foreground">{guest.phone}</p>}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={guest.status} />
                                            {guest.respondedAt && <p className="mt-1 text-xs text-muted-foreground">{guest.respondedAt}</p>}
                                        </td>
                                        <td className="hidden p-4 lg:table-cell">
                                            {guest.plusOne ? <span className="text-accent">Yes</span> : <span className="text-muted-foreground">No</span>}
                                        </td>
                                        <td className="hidden p-4 lg:table-cell">
                                            <span className="text-sm text-muted-foreground">{guest.dietaryNotes || "—"}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>
                                                        <Edit3 className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Mail className="mr-2 h-4 w-4" />
                                                        Send Email
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Remove
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredGuests.length === 0 && (
                        <div className="p-8 text-center">
                            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No guests found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function StatCard({
    label,
    value,
    icon: Icon,
    color,
    subtext,
}: {
    label: string
    value: string
    icon: React.ElementType
    color: string
    subtext?: string
}) {
    return (
        <div className="rounded-xl border border-border/60 bg-card/85 p-4 shadow-lg shadow-black/10 backdrop-blur">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                    <p className="text-2xl font-semibold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {subtext && <p className="mt-0.5 text-xs text-accent">{subtext}</p>}
                </div>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: Guest["status"] }) {
    const styles = {
        confirmed: "bg-accent/20 text-accent",
        pending: "bg-chart-4/20 text-chart-4",
        declined: "bg-destructive/20 text-destructive",
    }

    const icons = {
        confirmed: Check,
        pending: Clock,
        declined: X,
    }

    const Icon = icons[status]

    return (
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${styles[status]}`}>
            <Icon className="h-3 w-3" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    )
}

function getDaysUntilEvent(eventDate: string) {
    const monthIndexByName: Record<string, number> = {
        january: 0,
        february: 1,
        march: 2,
        april: 3,
        may: 4,
        june: 5,
        july: 6,
        august: 7,
        september: 8,
        october: 9,
        november: 10,
        december: 11,
    }

    const [monthName, dayText] = eventDate.trim().split(/\s+/)
    const monthIndex = monthIndexByName[monthName.toLowerCase()]
    const day = Number.parseInt(dayText, 10)

    if (Number.isNaN(monthIndex) || Number.isNaN(day)) {
        return "--"
    }

    const today = new Date()
    const event = new Date(today.getFullYear(), monthIndex, day)
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const diffMs = event.getTime() - startOfToday.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
        return `${Math.abs(diffDays)} past`
    }

    return diffDays.toString()
}
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Search,
  Filter,
  Upload,
  Mail,
  MoreHorizontal,
  Check,
  X,
  Clock,
  Users,
  Calendar,
  Bell,
  ChevronDown,
  Download,
  Trash2,
  Edit3,
  Send
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

type Guest = {
  id: string
  name: string
  email: string
  phone?: string
  status: "confirmed" | "pending" | "declined"
  plusOne: boolean
  dietaryNotes?: string
  respondedAt?: string
}

const guests: Guest[] = [
  { id: "1", name: "Emma Thompson", email: "emma@example.com", phone: "+1 555-0101", status: "confirmed", plusOne: true, respondedAt: "2 days ago" },
  { id: "2", name: "James Wilson", email: "james@example.com", phone: "+1 555-0102", status: "confirmed", plusOne: false, dietaryNotes: "Vegetarian", respondedAt: "3 days ago" },
  { id: "3", name: "Sarah Chen", email: "sarah@example.com", status: "pending", plusOne: true },
  { id: "4", name: "Michael Brown", email: "michael@example.com", phone: "+1 555-0104", status: "confirmed", plusOne: true, respondedAt: "1 day ago" },
  { id: "5", name: "Lisa Anderson", email: "lisa@example.com", status: "declined", plusOne: false, respondedAt: "4 days ago" },
  { id: "6", name: "David Kim", email: "david@example.com", phone: "+1 555-0106", status: "pending", plusOne: false },
  { id: "7", name: "Jennifer Martinez", email: "jennifer@example.com", status: "confirmed", plusOne: true, dietaryNotes: "Gluten-free", respondedAt: "5 days ago" },
  { id: "8", name: "Robert Taylor", email: "robert@example.com", phone: "+1 555-0108", status: "pending", plusOne: true },
  { id: "9", name: "Amanda White", email: "amanda@example.com", status: "confirmed", plusOne: false, respondedAt: "1 day ago" },
  { id: "10", name: "Christopher Lee", email: "chris@example.com", phone: "+1 555-0110", status: "confirmed", plusOne: true, respondedAt: "6 days ago" },
]

const eventDetails = {
  title: "Summer Garden Party",
  date: "June 15, 2026",
  time: "6:00 PM",
  location: "Rose Garden Estate",
  daysUntil: 42,
}

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedGuests, setSelectedGuests] = useState<string[]>([])

  const confirmed = guests.filter(g => g.status === "confirmed").length
  const pending = guests.filter(g => g.status === "pending").length
  const declined = guests.filter(g => g.status === "declined").length

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         guest.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || guest.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const toggleSelectGuest = (id: string) => {
    setSelectedGuests(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedGuests.length === filteredGuests.length) {
      setSelectedGuests([])
    } else {
      setSelectedGuests(filteredGuests.map(g => g.id))
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{eventDetails.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {eventDetails.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {eventDetails.time}
            </span>
          </div>
        </div>

        {/* Event countdown widget */}
        <div className="flex items-center gap-6 bg-card rounded-xl border border-border/50 p-4">
          <div className="text-center">
            <p className="text-3xl font-semibold gradient-text">{eventDetails.daysUntil}</p>
            <p className="text-xs text-muted-foreground">days until event</p>
          </div>
          <div className="w-px h-12 bg-border" />
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-muted-foreground">{confirmed} confirmed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-chart-4" />
              <span className="text-muted-foreground">{pending} pending</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-muted-foreground">{declined} declined</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          label="Total Invited" 
          value={guests.length.toString()} 
          icon={Users}
          color="text-primary"
        />
        <StatCard 
          label="Confirmed" 
          value={confirmed.toString()} 
          icon={Check}
          color="text-accent"
          subtext={`${Math.round((confirmed / guests.length) * 100)}% response rate`}
        />
        <StatCard 
          label="Pending" 
          value={pending.toString()} 
          icon={Clock}
          color="text-chart-4"
        />
        <StatCard 
          label="Plus Ones" 
          value={guests.filter(g => g.plusOne && g.status === "confirmed").length.toString()} 
          icon={Users}
          color="text-chart-3"
        />
      </div>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search guests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-border/50">
                <Filter className="w-4 h-4 mr-2" />
                {statusFilter === "all" ? "All Status" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("confirmed")}>Confirmed</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("pending")}>Pending</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("declined")}>Declined</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="border-border/50">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>

          <Button size="sm" className="gradient-primary border-0 text-white">
            <Bell className="w-4 h-4 mr-2" />
            Send Reminders
          </Button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedGuests.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-primary/10 rounded-lg">
          <span className="text-sm font-medium">{selectedGuests.length} selected</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Send className="w-4 h-4 mr-1" />
              Email
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive">
              <Trash2 className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      )}

      {/* Guest table */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/50">
                <th className="text-left p-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedGuests.length === filteredGuests.length && filteredGuests.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-border"
                  />
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Guest</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Contact</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Plus One</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Notes</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest) => (
                <tr key={guest.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-smooth">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedGuests.includes(guest.id)}
                      onChange={() => toggleSelectGuest(guest.id)}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{guest.name}</p>
                      <p className="text-sm text-muted-foreground md:hidden">{guest.email}</p>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <div className="text-sm">
                      <p>{guest.email}</p>
                      {guest.phone && <p className="text-muted-foreground">{guest.phone}</p>}
                    </div>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={guest.status} />
                    {guest.respondedAt && (
                      <p className="text-xs text-muted-foreground mt-1">{guest.respondedAt}</p>
                    )}
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    {guest.plusOne ? (
                      <span className="text-accent">Yes</span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {guest.dietaryNotes || "—"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
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
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No guests found</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color,
  subtext 
}: { 
  label: string
  value: string
  icon: React.ElementType
  color: string
  subtext?: string
}) {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {subtext && <p className="text-xs text-accent mt-0.5">{subtext}</p>}
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
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${styles[status]}`}>
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

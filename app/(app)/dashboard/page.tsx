"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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

const stats = [
  { label: "Total Events", value: "12", icon: Calendar, color: "text-primary" },
  { label: "Total Guests", value: "847", icon: Users, color: "text-accent" },
  { label: "Responses", value: "623", icon: Mail, color: "text-chart-3" },
  { label: "Upcoming", value: "4", icon: Clock, color: "text-chart-4" },
]

const events = [
  {
    id: "1",
    title: "Summer Garden Party",
    description: "An elegant outdoor celebration",
    date: "Jun 15, 2026",
    time: "6:00 PM",
    guests: { total: 50, confirmed: 45, pending: 5 },
    status: "active",
    reminder: true,
    color: "from-accent/30 via-accent/10 to-transparent",
  },
  {
    id: "2",
    title: "Product Launch Event",
    description: "Introducing our newest innovation",
    date: "Jul 8, 2026",
    time: "2:00 PM",
    guests: { total: 150, confirmed: 120, pending: 30 },
    status: "active",
    reminder: true,
    color: "from-primary/30 via-primary/10 to-transparent",
  },
  {
    id: "3",
    title: "Annual Team Celebration",
    description: "Celebrating another great year",
    date: "Aug 20, 2026",
    time: "7:00 PM",
    guests: { total: 100, confirmed: 80, pending: 12 },
    status: "draft",
    reminder: false,
    color: "from-chart-3/30 via-chart-3/10 to-transparent",
  },
  {
    id: "4",
    title: "Wedding Anniversary",
    description: "25 years of love and laughter",
    date: "Sep 5, 2026",
    time: "5:00 PM",
    guests: { total: 75, confirmed: 60, pending: 10 },
    status: "active",
    reminder: true,
    color: "from-chart-4/30 via-chart-4/10 to-transparent",
  },
  {
    id: "5",
    title: "Charity Gala",
    description: "Making a difference together",
    date: "Oct 12, 2026",
    time: "7:30 PM",
    guests: { total: 200, confirmed: 150, pending: 35 },
    status: "draft",
    reminder: false,
    color: "from-chart-5/30 via-chart-5/10 to-transparent",
  },
  {
    id: "6",
    title: "Holiday Party",
    description: "Festive cheer and good times",
    date: "Dec 20, 2026",
    time: "6:00 PM",
    guests: { total: 80, confirmed: 55, pending: 20 },
    status: "active",
    reminder: true,
    color: "from-accent/30 via-primary/10 to-transparent",
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const handleViewEvent = (event: typeof events[0]) => {
    // Create preview data based on the event
    const previewData = {
      id: event.id,
      title: event.title,
      theme: {
        primaryColor: "from-accent via-primary to-chart-3",
        backgroundColor: "bg-card",
      },
      pages: [
        {
          id: "cover",
          type: "cover",
          content: {
            headline: "You're Invited",
            subheadline: event.title,
            hostName: "Event Host",
          }
        },
        {
          id: "details",
          type: "details",
          content: {
            headline: "Event Details",
            date: event.date,
            time: event.time,
            location: "Event Venue",
            address: "123 Event Street",
            description: event.description,
          }
        },
        {
          id: "rsvp",
          type: "rsvp",
          content: {
            headline: "RSVP",
            subheadline: "Please let us know if you can make it",
            fields: [
              { label: "Full Name", type: "text", required: true },
              { label: "Email", type: "email", required: true },
              { label: "Number of Guests", type: "select", options: ["1", "2", "3", "4"], required: true },
            ]
          }
        }
      ]
    }
    localStorage.setItem("eventora-preview-data", JSON.stringify(previewData))
    router.push("/preview")
  }
  
  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Manage your events and track responses</p>
        </div>
        <Button className="gradient-primary border-0 text-white" asChild>
          <Link href="/builder">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
        <Button variant="outline" size="sm" className="border-border/50">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Events grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}

function EventCard({ event }: { event: typeof events[0] }) {
  const confirmRate = Math.round((event.guests.confirmed / event.guests.total) * 100)

  return (
    <div className="group bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/30 transition-smooth">
      {/* Preview area */}
      <div className={`relative h-32 bg-gradient-to-br ${event.color}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Calendar className="w-12 h-12 text-muted-foreground/30" />
        </div>
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
            event.status === "active" 
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
              <DropdownMenuItem onClick={() => handleViewEvent(event)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/editor?event=${event.id}`}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
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
            <Link href={`/events?id=${event.id}`}>
              Manage
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

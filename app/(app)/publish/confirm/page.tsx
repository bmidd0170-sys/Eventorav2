"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ArrowRight, Calendar, ChevronLeft, Clock, Sparkles } from "lucide-react"

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function parseDateLabel(value: string) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function parseTimeLabel(value: string) {
  const normalized = value.trim().toUpperCase()
  const match = value.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i)

  if (!match) {
    const twelveHourMatch = normalized.match(/^(\d{1,2})(?:\s*([AP]M))?$/i)

    if (!twelveHourMatch) {
      return { hour: 6, minute: 0, period: "PM" as const }
    }

    const hour = Math.min(Math.max(Number(twelveHourMatch[1]), 1), 12)
    const period = twelveHourMatch[2]?.toUpperCase() === "AM" ? "AM" : "PM"
    return { hour, minute: 0, period }
  }

  let hour = Number(match[1])
  const minute = Number(match[2])
  const period = match[3].toUpperCase() === "AM" ? "AM" : "PM"

  if (hour === 0) hour = 12
  if (hour > 12) hour -= 12

  return { hour, minute, period }
}

function formatTimeLabel(hour: number, minute: number, period: "AM" | "PM") {
  return `${hour}:${minute.toString().padStart(2, "0")} ${period}`
}

export default function PublishConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const eventId = searchParams?.get("event")?.trim() ?? ""
  const title = searchParams?.get("title") ?? "Untitled Event"
  const pages = searchParams?.get("pages") ?? "0"
  const initialDate = searchParams?.get("date") ?? ""
  const initialTime = searchParams?.get("time") ?? ""
  const [selectedDate, setSelectedDate] = useState(() => parseDateLabel(initialDate))
  const [hour, setHour] = useState(() => parseTimeLabel(initialTime).hour)
  const [minute, setMinute] = useState(() => parseTimeLabel(initialTime).minute)
  const [period, setPeriod] = useState<"AM" | "PM">(() => parseTimeLabel(initialTime).period)
  const [timeText, setTimeText] = useState(() => initialTime || formatTimeLabel(parseTimeLabel(initialTime).hour, parseTimeLabel(initialTime).minute, parseTimeLabel(initialTime).period))

  useEffect(() => {
    setSelectedDate(parseDateLabel(initialDate))
    const parsedTime = parseTimeLabel(initialTime)
    setHour(parsedTime.hour)
    setMinute(parsedTime.minute)
    setPeriod(parsedTime.period)
    setTimeText(initialTime || formatTimeLabel(parsedTime.hour, parsedTime.minute, parsedTime.period))
  }, [initialDate, initialTime])

  const dateLabel = formatDateLabel(selectedDate)
  const timeLabel = formatTimeLabel(hour, minute, period)

  useEffect(() => {
    setTimeText(timeLabel)
  }, [timeLabel])

  const shareParams = new URLSearchParams()
  if (eventId) shareParams.set("event", eventId)
  shareParams.set("title", title)
  shareParams.set("pages", pages)
  shareParams.set("date", dateLabel)
  shareParams.set("time", timeLabel)
  shareParams.set("published", "true")
  shareParams.set("step", "share")

  const shareUrl = `/publish?${shareParams.toString()}`

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="h-14 border-b border-border/50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/editor" className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-medium">Confirm Invitation Details</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-6">
            <Sparkles className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-3xl font-semibold mb-3">Review before sharing</h2>
          <p className="text-muted-foreground max-w-2xl mb-8">
            Confirm the invitation details below, then continue to the share step.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <div className="rounded-2xl border border-border/50 bg-secondary/50 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Invitation</div>
              <div className="font-medium">{title}</div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-secondary/50 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Pages</div>
              <div className="font-medium">{pages}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 p-5 mb-8 overflow-visible">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-medium">Schedule</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-auto justify-start gap-3 rounded-xl border-border/60 bg-secondary/60 px-4 py-3 hover:bg-secondary/80"
                  >
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">Date</div>
                      <div className="text-sm font-medium">{dateLabel}</div>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" side="left" sideOffset={18} className="w-auto p-0 border-border/60 shadow-2xl">
                  <CalendarPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(nextDate) => nextDate && setSelectedDate(nextDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-auto justify-start gap-3 rounded-xl border-border/60 bg-secondary/60 px-4 py-3 hover:bg-secondary/80"
                  >
                    <Clock className="w-4 h-4 text-accent shrink-0" />
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">Time</div>
                      <div className="text-sm font-medium">{timeLabel}</div>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  side="right"
                  sideOffset={18}
                  onOpenAutoFocus={(event) => event.preventDefault()}
                  className="w-80 border-border/60 p-5 shadow-2xl"
                >
                  <div className="space-y-5">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Set a time</div>
                      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/60 px-4 py-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Selected time</div>
                          <input
                            value={timeText}
                            onChange={(event) => {
                              const nextValue = event.target.value
                              setTimeText(nextValue)

                              const parsedTime = parseTimeLabel(nextValue)
                              setHour(parsedTime.hour)
                              setMinute(parsedTime.minute)
                              setPeriod(parsedTime.period)
                            }}
                            onBlur={() => setTimeText(timeLabel)}
                            className="mt-1 w-full bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground"
                            placeholder="7:30 PM"
                          />
                        </div>
                        <Clock className="w-5 h-5 text-accent" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Hour</div>
                        <div className="grid grid-cols-4 gap-2">
                          {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                            <Button
                              key={value}
                              type="button"
                              variant={hour === value ? "default" : "outline"}
                              size="sm"
                              className="rounded-lg"
                              onClick={() => setHour(value)}
                            >
                              {value}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Minute</div>
                        <div className="grid grid-cols-2 gap-2">
                          {[0, 15, 30, 45].map((value) => (
                            <Button
                              key={value}
                              type="button"
                              variant={minute === value ? "default" : "outline"}
                              size="sm"
                              className="rounded-lg"
                              onClick={() => setMinute(value)}
                            >
                              {value.toString().padStart(2, "0")}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-2">AM / PM</div>
                      <div className="grid grid-cols-2 gap-2">
                        {(["AM", "PM"] as const).map((value) => (
                          <Button
                            key={value}
                            type="button"
                            variant={period === value ? "default" : "outline"}
                            className="rounded-lg"
                            onClick={() => setPeriod(value)}
                          >
                            {value}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" asChild className="sm:flex-1">
              <Link href="/editor">Go back</Link>
            </Button>
            <Button
              className="sm:flex-1 gradient-primary border-0 text-white"
              onClick={() => router.push(shareUrl)}
            >
              Continue to Share
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            This keeps the invitation published and moves you directly into sharing.
          </p>
        </div>
      </div>
    </div>
  )
}
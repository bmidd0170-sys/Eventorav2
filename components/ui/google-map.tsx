"use client"

import { useEffect, useRef } from "react"
import { useState } from "react"

interface GoogleMapProps {
    address?: string
    venue?: string
    className?: string
}

declare global {
    interface Window {
        google: {
            maps: {
                Map: any
                Geocoder: any
                GeocoderStatus: any
            }
        }
    }
}

export function GoogleMap({ address, venue, className = "w-full h-full" }: GoogleMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any | null>(null)
    const [showPin, setShowPin] = useState(false)
    const [isMapsReady, setIsMapsReady] = useState(false)

    useEffect(() => {
        if (window.google?.maps) {
            setIsMapsReady(true)
            return
        }

        let attempts = 0
        const maxAttempts = 60
        const poll = window.setInterval(() => {
            if (window.google?.maps) {
                setIsMapsReady(true)
                window.clearInterval(poll)
                return
            }

            attempts += 1
            if (attempts >= maxAttempts) {
                window.clearInterval(poll)
            }
        }, 250)

        const mapScript = document.querySelector<HTMLScriptElement>('script[src*="maps.googleapis.com/maps/api/js"]')
        const onLoad = () => setIsMapsReady(true)

        mapScript?.addEventListener("load", onLoad)

        return () => {
            window.clearInterval(poll)
            mapScript?.removeEventListener("load", onLoad)
        }
    }, [])

    useEffect(() => {
        if (!mapRef.current || !isMapsReady || !window.google?.maps) return

        if (!mapInstanceRef.current) {
            mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                zoom: 15,
                mapTypeControl: false,
                fullscreenControl: false,
            })
        }

        const map = mapInstanceRef.current

        // Geocode the address and center map
        const geocoder = new window.google.maps.Geocoder()
        const searchAddress = address || venue || "New York, NY"

        geocoder.geocode({ address: searchAddress }, async (results: any[], status: string) => {
            if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
                const location = results[0].geometry.location
                map.setCenter(location)
                setShowPin(true)
            } else {
                // Default to NYC if geocoding fails
                map.setCenter({ lat: 40.7128, lng: -74.006 })
                setShowPin(false)
            }
        })
    }, [address, venue, isMapsReady])

    return (
        <div className="relative overflow-hidden" aria-label={venue || address || "Location map"}>
            <div ref={mapRef} className={className} />
            {!isMapsReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
                    <p className="text-xs text-muted-foreground">Loading map...</p>
                </div>
            )}
            {showPin && (
                <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
                    <div className="flex flex-col items-center">
                        <div className="h-4 w-4 rounded-full bg-primary shadow-lg shadow-primary/30" />
                        <div className="h-10 w-1 rounded-full bg-primary/25" />
                    </div>
                </div>
            )}
        </div>
    )
}

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

    useEffect(() => {
        if (!mapRef.current || !window.google) return

        // Create map
        const map = new window.google.maps.Map(mapRef.current, {
            zoom: 15,
            mapTypeControl: false,
            fullscreenControl: false,
        })

        mapInstanceRef.current = map

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
    }, [address, venue])

    return (
        <div className="relative overflow-hidden" aria-label={venue || address || "Location map"}>
            <div ref={mapRef} className={className} />
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

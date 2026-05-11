"use client"

import { useEffect, useRef } from "react"

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
        marker: {
          AdvancedMarkerElement: any
        }
      }
    }
  }
}

export function GoogleMap({ address, venue, className = "w-full h-full" }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any | null>(null)

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

        // Use AdvancedMarkerElement instead of deprecated Marker
        try {
          const AdvancedMarkerElement = window.google.maps.marker.AdvancedMarkerElement
          if (AdvancedMarkerElement) {
            new AdvancedMarkerElement({
              map,
              position: location,
              title: venue || address,
            })
          } else {
            // Fallback to Marker if AdvancedMarkerElement not available
            console.warn("AdvancedMarkerElement not available, falling back to Marker")
          }
        } catch (e) {
          console.warn("Error creating advanced marker:", e)
        }
      } else {
        // Default to NYC if geocoding fails
        map.setCenter({ lat: 40.7128, lng: -74.006 })
      }
    })
  }, [address, venue])

  return <div ref={mapRef} className={className} />
}

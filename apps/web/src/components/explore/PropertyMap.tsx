import { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Body, Overline } from '@axori/ui'
import { cn } from '@/utils/helpers'
import { useTheme } from '@/utils/providers/theme-provider'

interface Property {
  id: string
  lat: number
  lng: number
  iq: number
  match: number
}

interface PropertyMapProps {
  properties: Array<Property>
  selectedPropertyId: string | null
  onPropertySelect: (propertyId: string) => void
  className?: string
}

export const PropertyMap = ({
  properties,
  selectedPropertyId,
  onPropertySelect,
  className,
}: PropertyMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Array<mapboxgl.Marker>>([])
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  // Detect desktop screen size
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024) // lg breakpoint
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  // Convert properties to GeoJSON format
  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: properties.map((property) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [property.lng, property.lat],
        },
        properties: {
          id: property.id,
          iq: property.iq,
          match: property.match,
        },
      })),
    }),
    [properties],
  )

  // Mapbox access token - reads from root .env file (VITE_MAPBOX_ACCESS_TOKEN)
  // The vite.config.ts is configured to load env vars from the root directory
  const MAPBOX_TOKEN =
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
    'pk.eyJ1IjoidGVzdCIsImEiOiJjbGV4YW1wbGUifQ.example'

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      accessToken: MAPBOX_TOKEN,
      style: isDark
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/light-v11',
      center: [-97.7431, 30.2672], // Austin, TX center
      zoom: 11,
      attributionControl: false,
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.current.on('load', () => {
      setMapLoaded(true)
    })

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [MAPBOX_TOKEN, isDark])

  // Update map style when theme changes
  useEffect(() => {
    if (map.current && mapLoaded) {
      map.current.setStyle(
        isDark
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/light-v11',
      )
    }
  }, [isDark, mapLoaded])

  // Add/update markers from GeoJSON
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Add markers from GeoJSON features
    geojson.features.forEach((feature) => {
      const { id } = feature.properties
      const [lng, lat] = feature.geometry.coordinates
      const isSelected = selectedPropertyId === id

      // Center map on selected property
      // Fix: Only flyTo when a new property is selected, not on every render of every marker.
      // This avoids centering on every marker render and only recenters when selectedPropertyId changes.
      // We extract this to a dedicated useEffect instead (outside the marker loop).
      // So here, REMOVE flyTo logic entirely from marker rendering loop for correct behavior.
      // Change pin color for selected property
      const markerColor = isSelected
        ? isDark
          ? '#E8FF4D'
          : '#7c3aed' // Highlight color for selected pin
        : isDark
          ? '#BCC8E7' // static non-selected light mode color
          : '#5A36FF' // static non-selected dark mode color

      // Create marker with stable positioning
      const marker = new mapboxgl.Marker({
        color: markerColor,
      })
        .setLngLat([lng, lat])
        .addTo(map.current!)

      // // Add click handler
      marker._element.addEventListener('click', () => {
        onPropertySelect(id)
      })

      markersRef.current.push(marker)
    })

    // Fit map to show all properties if there are any
    if (geojson.features.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      geojson.features.forEach((feature) => {
        const [lng, lat] = feature.geometry.coordinates
        bounds.extend([lng, lat])
      })
      map.current.fitBounds(bounds, {
        padding: {
          top: 50,
          bottom: 50,
          left: 50,
          right: isDesktop ? 530 : 50, // Add extra padding on right for desktop overlay (480px + 50px)
        },
        maxZoom: 13,
      })
    }
  }, [
    geojson,
    selectedPropertyId,
    mapLoaded,
    isDark,
    isDesktop,
    onPropertySelect,
  ])

  return (
    <div className={cn('relative w-full h-full', className)}>
      <div ref={mapContainer} className="w-full h-full" />
      {/* Market Info Overlay */}
      <div className="absolute bottom-8 left-8 flex flex-col gap-2 z-10 pointer-events-none max-w-[280px]">
        <div
          className={cn(
            'p-4 rounded-3xl backdrop-blur-md shadow-2xl border',
            isDark
              ? 'bg-black/50 border-white/10 text-white'
              : 'bg-white/70 border-white text-slate-900',
          )}
        >
          <Overline
            className={cn(
              'text-[10px] font-black uppercase tracking-widest mb-1 opacity-60 whitespace-nowrap',
              isDark ? 'text-white/60' : 'text-slate-500',
            )}
          >
            Center Market
          </Overline>
          <Body weight="black" className="text-sm uppercase whitespace-nowrap">
            Austin Tech Corridor
          </Body>
        </div>
      </div>
    </div>
  )
}

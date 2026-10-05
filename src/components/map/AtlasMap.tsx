import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import type { CustomPin, Location, InteractionMode, ViewportState } from '../../data/types'
import { categoryById, filterKeyForLocation, placeFilterById } from '../../data/categories'
import { mapMeta } from '../../data/locations'
import { categoryIcon, formatDistance } from '../../lib/format'
import { useAtlasStore } from '../../state/useAtlasStore'
import { Icon } from '../ui/Icon'

type Props = { locations: Location[]; mode: InteractionMode; onSelect: (id: string) => void; onAddPin: (coords: [number, number]) => void }

function markerHtml(location: Location, found: boolean) {
  const category = categoryById[location.category]
  const glyph = categoryIcon[location.category]
  const symbol: Record<string, string> = { Map: '✦', Gem: '◆', Package: '▣', ScrollText: '≋', UserRound: '●', Bug: '✹', Pickaxe: '⌁', Sprout: '✤' }
  const placeGlyph: Record<string, string> = { city: '⌂', town: '⌂', village: '⌁', camp: '♠', 'giant-camp': '♜', 'imperial-camp': '⚑', 'stormcloak-camp': '⚑', 'dwemer-ruin': '⚙', 'nordic-ruin': 'ᛟ', ruin: '◈', cave: '◒', mine: '⌁', fort: '▣', tower: '△', 'dragon-lair': '♨', 'dragon-mound': '♨', shrine: '✧', 'daedric-shrine': '☠', temple: '✥', house: '⌂', farm: '✤', inn: '◆', pass: '⌃', shipwreck: '⌁', lighthouse: '⚑', 'standing-stone': '◆', 'word-wall': '≋', grove: '✤', clearing: '·', cemetery: '†', dock: '≈', 'orc-stronghold': '♜' }
  const filter = location.category === 'places' ? placeFilterById[location.sourceType] : undefined
  return `<div class="atlas-marker ${filter ? 'is-place-marker' : ''} ${found ? 'is-found' : ''}" style="--marker-color:${filter?.color ?? category.color}" title="${location.title}"><span>${filter ? placeGlyph[location.sourceType] ?? '•' : symbol[glyph] ?? '•'}</span></div>`
}

function ClusterLayer({ locations, onSelect }: { locations: Location[]; onSelect: (id: string) => void }) {
  const map = useMap()
  const foundIds = useAtlasStore((state) => state.foundIds)
  const visibleCategories = useAtlasStore((state) => state.visibleCategories)
  const hideFound = useAtlasStore((state) => state.hideFound)

  useEffect(() => {
    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 30,
      disableClusteringAtZoom: 2,
      showCoverageOnHover: false,
      iconCreateFunction: (group) => L.divIcon({ className: 'atlas-cluster-wrap', html: `<div class="atlas-cluster">${group.getChildCount()}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] })
    })
    locations.forEach((location) => {
      const found = foundIds.includes(location.id)
      const visibilityKey = filterKeyForLocation(location)
      if (visibleCategories[location.category] === false || visibleCategories[visibilityKey] === false || (hideFound && found)) return
      const icon = L.divIcon({ className: 'atlas-marker-wrap', html: markerHtml(location, found), iconSize: [34, 34], iconAnchor: [17, 17] })
      const marker = L.marker(location.coords, { icon, keyboard: true, title: location.title })
      marker.on('click', () => onSelect(location.id))
      marker.on('keypress', (event) => { if ((event.originalEvent as KeyboardEvent).key === 'Enter') onSelect(location.id) })
      cluster.addLayer(marker)
    })
    map.addLayer(cluster)
    return () => { map.removeLayer(cluster) }
  }, [locations, onSelect, map, foundIds, visibleCategories, hideFound])
  return null
}

function CustomPinsLayer({ pins, onRemove }: { pins: CustomPin[]; onRemove: (id: string) => void }) {
  const map = useMap()
  const activeMap = useAtlasStore((state) => state.activeMap)
  useEffect(() => {
    const layers = pins.filter((pin) => pin.mapId === activeMap).map((pin) => {
      const icon = L.divIcon({ className: 'custom-pin-wrap', html: `<div class="custom-pin" style="--pin-color:${pin.color}">⌖</div>`, iconSize: [30, 30], iconAnchor: [15, 30] })
      const marker = L.marker(pin.coords, { icon, title: pin.title }).bindTooltip(pin.title, { direction: 'top', offset: [0, -24] })
      marker.on('contextmenu', () => onRemove(pin.id))
      marker.addTo(map)
      return marker
    })
    return () => { layers.forEach((layer) => map.removeLayer(layer)) }
  }, [activeMap, map, onRemove, pins])
  return null
}

function RouteStopsLayer({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    const markers = points.map((point, index) => L.marker(point, { icon: L.divIcon({ className: 'route-stop-wrap', html: `<div class="route-stop">${index + 1}</div>`, iconSize: [22, 22], iconAnchor: [11, 11] }) }).addTo(map))
    return () => { markers.forEach((marker) => map.removeLayer(marker)) }
  }, [map, points])
  return null
}

function MapInteractions({ mode, onAddPin }: { mode: InteractionMode; onAddPin: (coords: [number, number]) => void }) {
  const { addMeasurePoint, addRoutePoint } = useAtlasStore()
  useMapEvents({ click: (event) => {
    const coords: [number, number] = [event.latlng.lat, event.latlng.lng]
    if (mode === 'pin') onAddPin(coords)
    if (mode === 'measure') addMeasurePoint(coords)
    if (mode === 'route') addRoutePoint(coords)
  } })
  return null
}

function ViewportSync() {
  const map = useMap()
  const activeMap = useAtlasStore((state) => state.activeMap)
  const viewport = useAtlasStore((state) => state.viewportByMap[activeMap])
  const setViewport = useAtlasStore((state) => state.setViewport)
  const previous = useRef<ViewportState | undefined>(undefined)
  useEffect(() => { if (viewport && JSON.stringify(previous.current) !== JSON.stringify(viewport)) { map.setView(viewport.center, viewport.zoom); previous.current = viewport } }, [map, viewport])
  useEffect(() => {
    const locate = () => map.setView(viewport?.center ?? mapMeta[activeMap].center, viewport?.zoom ?? 1, { animate: true })
    window.addEventListener('atlas-locate', locate)
    return () => window.removeEventListener('atlas-locate', locate)
  }, [map, viewport])
  useMapEvents({ moveend: () => { const center = map.getCenter(); setViewport(activeMap, { center: [center.lat, center.lng], zoom: map.getZoom() }) } })
  return null
}

function FocusLocation({ location }: { location: Location | null }) {
  const map = useMap()
  useEffect(() => { if (location) map.flyTo(location.coords, Math.max(map.getZoom(), 2), { duration: 0.35 }) }, [location, map])
  return null
}

export function AtlasMap({ locations, mode, onSelect, onAddPin, focusLocation }: Props & { focusLocation: Location | null }) {
  const activeMap = useAtlasStore((state) => state.activeMap)
  const world = mapMeta[activeMap]
  const pins = useAtlasStore((state) => state.pins)
  const removePin = useAtlasStore((state) => state.removePin)
  const measurePoints = useAtlasStore((state) => state.measurePoints)
  const routePoints = useAtlasStore((state) => state.routePoints)
  const lines = useMemo(() => ({ measure: measurePoints, route: routePoints }), [measurePoints, routePoints])
  return (
    <div className="map-shell">
      <MapContainer key={activeMap} className="atlas-leaflet" crs={L.CRS.Simple} center={world.center} zoom={1} minZoom={0} maxZoom={world.maxZoom} maxBounds={world.bounds} maxBoundsViscosity={0.85} zoomControl={false} attributionControl={false}>
        <TileLayer url={`/map/tiles/${activeMap}/{z}/{x}/{y}.webp`} tileSize={512} minZoom={0} maxZoom={world.maxZoom} maxNativeZoom={world.nativeMaxZoom} noWrap={true} keepBuffer={2} />
        <ClusterLayer locations={locations} onSelect={onSelect} />
        <CustomPinsLayer pins={pins} onRemove={removePin} />
        <RouteStopsLayer points={routePoints} />
        <MapInteractions mode={mode} onAddPin={onAddPin} />
        <ViewportSync />
        <FocusLocation location={focusLocation} />
        {lines.measure.length > 1 && <Polyline positions={lines.measure} pathOptions={{ color: '#f0b35b', weight: 3, dashArray: '6 8' }} />}
        {lines.route.length > 1 && <Polyline positions={lines.route} pathOptions={{ color: '#8dd4af', weight: 4 }} />}
        <MapOverlay mode={mode} measurePoints={measurePoints} routePoints={routePoints} />
      </MapContainer>
      <div className="map-attribution">Map tiles © UESP (uesp.net), CC BY-SA 2.5 · Adaptados via skyrimmap.com</div>
    </div>
  )
}

function MapOverlay({ mode, measurePoints, routePoints }: { mode: InteractionMode; measurePoints: [number, number][]; routePoints: [number, number][] }) {
  const map = useMap()
  return <div className="map-overlay-control"><div className="map-coordinates"><span className="status-dot" /> {Math.round(map.getCenter().lat)} / {Math.round(map.getCenter().lng)}</div>{mode === 'measure' && <div className="draw-readout"><Icon name="Ruler" size={14} /> {formatDistance(measurePoints)}</div>}{mode === 'route' && <div className="draw-readout route-readout"><Icon name="Route" size={14} /> {formatDistance(routePoints)}</div>}</div>
}

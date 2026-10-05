import { useMemo, useState } from 'react'
import type { Location } from '../../data/types'
import { placeFilterById } from '../../data/categories'
import { formatDistance } from '../../lib/format'
import { Icon } from '../ui/Icon'

type RouteMode = 'dungeons' | 'caves' | 'mix'
type RoutePreference = 'shortest' | 'variety' | 'nearby'

type Props = {
  locations: Location[]
  foundIds: string[]
  onClose: () => void
  onApply: (points: [number, number][]) => void
}

const dungeonTypes = new Set(['dwemer-ruin', 'nordic-ruin', 'ruin', 'fort', 'dragon-lair', 'mine'])
const caveTypes = new Set(['cave'])

function distance(a: Location, b: Location) { return Math.hypot(a.coords[0] - b.coords[0], a.coords[1] - b.coords[1]) }
function totalDistance(route: Location[]) { return route.slice(1).reduce((total, location, index) => total + distance(route[index], location), 0) }

function optimizeRoute(route: Location[], fixedEnd: boolean) {
  let best = [...route]
  let improved = true
  const end = fixedEnd ? best.length - 1 : best.length
  while (improved) {
    improved = false
    for (let start = 1; start < end - 1; start += 1) {
      for (let finish = start + 1; finish < end; finish += 1) {
        const candidate = [...best.slice(0, start), ...best.slice(start, finish + 1).reverse(), ...best.slice(finish + 1)]
        if (totalDistance(candidate) + 0.001 < totalDistance(best)) { best = candidate; improved = true }
      }
    }
  }
  return best
}

export function RoutePlannerModal({ locations, foundIds, onClose, onApply }: Props) {
  const origins = useMemo(() => locations.filter((location) => location.category === 'places' && ['city', 'town', 'village'].includes(location.sourceType)).sort((a, b) => a.title.localeCompare(b.title)), [locations])
  const regions = useMemo(() => [...new Set(locations.filter((location) => location.category === 'places').map((location) => location.region))].sort(), [locations])
  const [originId, setOriginId] = useState(origins[0]?.id ?? '')
  const [destinationId, setDestinationId] = useState('')
  const [mode, setMode] = useState<RouteMode>('mix')
  const [preference, setPreference] = useState<RoutePreference>('shortest')
  const [stopLimit, setStopLimit] = useState(6)
  const [region, setRegion] = useState('all')
  const [maxRadius, setMaxRadius] = useState(0)
  const [avoidFound, setAvoidFound] = useState(true)
  const [returnOrigin, setReturnOrigin] = useState(false)
  const [stops, setStops] = useState<Location[] | null>(null)
  const [addId, setAddId] = useState('')
  const [copied, setCopied] = useState(false)

  const origin = origins.find((location) => location.id === originId) ?? origins[0]
  const destination = origins.find((location) => location.id === destinationId)
  const candidateTypes = mode === 'dungeons' ? dungeonTypes : mode === 'caves' ? caveTypes : new Set([...dungeonTypes, ...caveTypes])
  const allCandidates = useMemo(() => locations.filter((location) => location.category === 'places' && candidateTypes.has(location.sourceType) && location.id !== origin?.id && location.id !== destination?.id && (region === 'all' || location.region === region) && (!avoidFound || !foundIds.includes(location.id)) && (!maxRadius || (origin && distance(origin, location) <= maxRadius))), [locations, candidateTypes, origin, destination, region, avoidFound, foundIds, maxRadius])

  function chooseStops() {
    if (!origin) return
    const available = [...allCandidates]
    const nextStops: Location[] = []
    let cursor = origin
    while (nextStops.length < stopLimit && available.length) {
      let bestIndex = 0
      let bestScore = Number.POSITIVE_INFINITY
      for (let index = 0; index < available.length; index += 1) {
        const candidate = available[index]
        const leg = distance(cursor, candidate)
        const sameTypeCount = nextStops.filter((stop) => stop.sourceType === candidate.sourceType).length
        const score = preference === 'variety' ? leg + sameTypeCount * 80 : preference === 'nearby' ? leg * (1 + nextStops.length * 0.02) : leg
        if (score < bestScore) { bestScore = score; bestIndex = index }
      }
      const [next] = available.splice(bestIndex, 1)
      nextStops.push(next)
      cursor = next
    }
    setStops(nextStops)
    setAddId('')
  }

  const routeLocations = origin && stops ? optimizeRoute([origin, ...stops, ...(destination ? [destination] : returnOrigin ? [origin] : [])], Boolean(destination || returnOrigin)) : []
  const editableStops = destination || returnOrigin ? routeLocations.slice(1, -1) : routeLocations.slice(1)
  const routeDistance = routeLocations.length > 1 ? formatDistance(routeLocations.map((location) => location.coords)) : '0 m'
  const addable = allCandidates.filter((location) => !editableStops.some((stop) => stop.id === location.id))

  function updateStops(next: Location[]) { setStops(next); setAddId('') }
  function moveStop(index: number, direction: -1 | 1) {
    const next = [...editableStops]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    updateStops(next)
  }
  function removeStop(index: number) { updateStops(editableStops.filter((_, current) => current !== index)) }
  function addStop() { const location = addable.find((candidate) => candidate.id === addId); if (location) updateStops([...editableStops, location]) }
  function applyRoute() { if (routeLocations.length > 1) { onApply(routeLocations.map((location) => location.coords)); onClose() } }
  async function copyShareLink() { const ids = routeLocations.map((location) => location.id).join(','); await navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}?route=${encodeURIComponent(ids)}`); setCopied(true); window.setTimeout(() => setCopied(false), 1800) }

  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="route-planner-title"><div className="modal-card route-planner-card"><div className="modal-heading"><div><span className="eyebrow">PLANEJADOR DE EXPEDIÇÃO</span><h2 id="route-planner-title">Montar rota inteligente</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Fechar planejador"><Icon name="X" size={17} /></button></div><p>O atlas escolhe os locais mais próximos, elimina zigue-zague com 2-opt e prioriza o que ainda não foi encontrado.</p><div className="planner-grid"><label>Estou em<select value={originId} onChange={(event) => { setOriginId(event.target.value); setStops(null) }}>{origins.map((location) => <option value={location.id} key={location.id}>{location.title}</option>)}</select></label><label>Destino final <span className="field-hint">opcional</span><select value={destinationId} onChange={(event) => { setDestinationId(event.target.value); setReturnOrigin(false); setStops(null) }}><option value="">Sem destino</option>{origins.filter((location) => location.id !== origin?.id).map((location) => <option value={location.id} key={location.id}>{location.title}</option>)}</select></label></div><div className="route-mode-grid"><button type="button" className={mode === 'dungeons' ? 'route-mode is-selected' : 'route-mode'} onClick={() => { setMode('dungeons'); setStops(null) }}><Icon name="Castle" size={18} /><span><strong>Dungeons</strong><small>Ruínas, fortes e covis</small></span></button><button type="button" className={mode === 'caves' ? 'route-mode is-selected' : 'route-mode'} onClick={() => { setMode('caves'); setStops(null) }}><Icon name="CircleDot" size={18} /><span><strong>Cavernas</strong><small>Somente cavernas</small></span></button><button type="button" className={mode === 'mix' ? 'route-mode is-selected' : 'route-mode'} onClick={() => { setMode('mix'); setStops(null) }}><Icon name="Shuffle" size={18} /><span><strong>Mixer</strong><small>Dungeons + cavernas</small></span></button></div><div className="planner-grid"><label>Estratégia<select value={preference} onChange={(event) => { setPreference(event.target.value as RoutePreference); setStops(null) }}><option value="shortest">Menor distância total</option><option value="nearby">Mais próximas primeiro</option><option value="variety">Maior variedade de tipos</option></select></label><label>Região<select value={region} onChange={(event) => { setRegion(event.target.value); setStops(null) }}><option value="all">Todas as regiões</option>{regions.map((item) => <option value={item} key={item}>{item}</option>)}</select></label></div><div className="planner-grid"><label>Paradas <span className="field-hint">{stopLimit} locais</span><input type="range" min="2" max="12" value={stopLimit} onChange={(event) => { setStopLimit(Number(event.target.value)); setStops(null) }} /></label><label>Raio de busca<select value={maxRadius} onChange={(event) => { setMaxRadius(Number(event.target.value)); setStops(null) }}><option value="0">Sem limite</option><option value="150">Até 150 m</option><option value="250">Até 250 m</option><option value="400">Até 400 m</option></select></label></div><div className="planner-checks"><label className="check-row"><input type="checkbox" checked={avoidFound} onChange={(event) => { setAvoidFound(event.target.checked); setStops(null) }} /><span />Evitar locais já encontrados <small>{foundIds.length} registrados</small></label><label className="check-row"><input type="checkbox" checked={returnOrigin} disabled={Boolean(destination)} onChange={(event) => { setReturnOrigin(event.target.checked); setStops(null) }} /><span />Voltar à origem no final{destination && <small> escolha um destino ou retorno</small>}</label></div><button type="button" className="primary-action route-build-button" onClick={chooseStops}><Icon name="Route" size={16} /> Calcular rota otimizada</button>{stops && <div className="route-result"><div className="route-result-top"><span>{editableStops.length} paradas · {allCandidates.length} disponíveis</span><strong>{routeDistance}</strong></div><ol>{routeLocations.map((location, index) => <li key={`${location.id}-${index}`}><span className="route-step">{index + 1}</span><span><strong>{location.title}</strong><small>{index === 0 ? 'Origem' : index === routeLocations.length - 1 && (destination || returnOrigin) ? destination ? 'Destino final' : 'Retorno à origem' : `${placeFilterById[location.sourceType]?.label ?? location.sourceType} · ${index > 0 ? formatDistance([routeLocations[index - 1].coords, location.coords]) : ''}`}</small></span>{index > 0 && index < routeLocations.length - (destination || returnOrigin ? 1 : 0) && <span className="route-item-actions"><button type="button" onClick={() => moveStop(index - 1, -1)} aria-label="Mover parada para cima">↑</button><button type="button" onClick={() => moveStop(index - 1, 1)} aria-label="Mover parada para baixo">↓</button><button type="button" onClick={() => removeStop(index - 1)} aria-label="Remover parada">×</button></span>}</li>)}</ol><div className="route-add-row"><select value={addId} onChange={(event) => setAddId(event.target.value)} aria-label="Adicionar uma parada"><option value="">Adicionar outra parada...</option>{addable.map((location) => <option value={location.id} key={location.id}>{location.title}</option>)}</select><button type="button" onClick={addStop} disabled={!addId} aria-label="Adicionar parada"><Icon name="Plus" size={15} /></button></div><div className="route-result-actions"><button type="button" className="secondary-action" onClick={copyShareLink}><Icon name="Copy" size={14} /> {copied ? 'Link copiado' : 'Copiar rota'}</button><button type="button" className="primary-action" onClick={applyRoute}><Icon name="Check" size={16} /> Usar no mapa</button></div></div>}</div></div>
}

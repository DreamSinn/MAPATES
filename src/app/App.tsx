import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { categories, categoryById, placeFilterKey, placeFilters } from '../data/categories'
import { locations } from '../data/locations'
import type { CategoryId, CustomPin, Location } from '../data/types'
import { useAtlasStore } from '../state/useAtlasStore'
import { AtlasMap } from '../components/map/AtlasMap'
import { RoutePlannerModal } from '../components/map/RoutePlannerModal'
import { Icon, type IconName } from '../components/ui/Icon'

const mapNames = { skyrim: 'Skyrim', solstheim: 'Solstheim' } as const
const categoryIconName: Record<CategoryId, IconName> = { places: 'Map', collectibles: 'Gem', items: 'Package', quests: 'ScrollText', npcs: 'UserRound', creatures: 'Bug', mining: 'Pickaxe', plants: 'Sprout' }

function App() {
  const [pinDraft, setPinDraft] = useState<{ coords: [number, number] } | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [routePlannerOpen, setRoutePlannerOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [catalog, setCatalog] = useState(locations)
  const { activeMap, selectedId, foundIds, notes, pins, search, hideFound, sidebarOpen, theme, mode, setSelected, setActiveMap, toggleFound, setNote, toggleSidebar, toggleTheme, setSearch, setHideFound, setMode, setRoutePoints, addPin, importProgress } = useAtlasStore()
  const activeLocations = useMemo(() => catalog.filter((location) => location.mapId === activeMap), [activeMap, catalog])
  const filteredLocations = useMemo(() => activeLocations.filter((location) => {
    const matchesSearch = !search || `${location.title} ${location.region} ${location.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  }), [activeLocations, search])
  const selected = activeLocations.find((location) => location.id === selectedId) ?? null
  const foundInMap = activeLocations.filter((location) => foundIds.includes(location.id)).length
  const visibleFiltered = filteredLocations.filter((location) => !hideFound || !foundIds.includes(location.id))

  useEffect(() => {
    const requestedMap = window.location.pathname.includes('solstheim') ? 'solstheim' : 'skyrim'
    if (requestedMap !== activeMap) setActiveMap(requestedMap)
    const locationId = new URLSearchParams(window.location.search).get('location')
    if (locationId && locations.some((location) => location.id === locationId)) setSelected(locationId)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    const title = selected ? `${selected.title} — Skyrim Atlas` : `${mapNames[activeMap]} — Skyrim Atlas`
    const description = selected ? `${selected.description} Explore coordenadas, notas e progresso no Skyrim Atlas.` : `Explore ${mapNames[activeMap]} com um atlas de campo próprio para registrar cada trilha.`
    document.title = title
    for (const [attribute, value] of [['name', 'description'], ['property', 'og:title'], ['property', 'og:description']] as const) {
      const selector = `meta[${attribute}="${value}"]`
      const meta = document.querySelector<HTMLMetaElement>(selector)
      if (meta) meta.content = attribute === 'name' ? description : value === 'og:title' ? title : description
    }
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
    canonical.href = window.location.href
    const params = new URLSearchParams(window.location.search)
    if (selected) params.set('location', selected.id); else params.delete('location')
    window.history.replaceState({}, '', `/skyrim/maps/${activeMap}${params.toString() ? `?${params}` : ''}`)
  }, [activeMap, selected, theme])
  useEffect(() => { fetch(`/api/locations?map=${activeMap}`).then((response) => response.ok ? response.json() : Promise.reject()).then((remote: Location[]) => { if (Array.isArray(remote) && remote.length) setCatalog((current) => [...current.filter((location) => location.mapId !== activeMap), ...remote]) }).catch(() => undefined) }, [activeMap])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'f' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') { event.preventDefault(); document.getElementById('atlas-search')?.focus() }
      if (event.key === 'Escape') { setSelected(null); setLoginOpen(false); setPinDraft(null) }
      if (event.key.toLowerCase() === 'h' && document.activeElement?.tagName !== 'INPUT') toggleSidebar()
    }
    window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown)
  }, [setSelected, toggleSidebar])
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 2600); return () => window.clearTimeout(timer) }, [toast])

  function chooseLocation(location: Location) { setSelected(location.id); setSearch('') }
  function createPin(coords: [number, number]) { setPinDraft({ coords }); setMode('idle') }
  function savePin(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const title = String(form.get('title') || 'Ponto pessoal'); const color = String(form.get('color') || '#f0b35b'); const pin: CustomPin = { id: `pin-${Date.now()}`, mapId: activeMap, title, icon: String(form.get('icon') || 'pin'), color, coords: pinDraft?.coords ?? [365, 600], createdAt: new Date().toISOString() }; addPin(pin); setPinDraft(null); setToast('Ponto pessoal adicionado ao atlas') }
  function exportProgress() { const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), foundIds, notes, pins }, null, 2); const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'skyrim-atlas-progress.json'; anchor.click(); URL.revokeObjectURL(url); setToast('Progresso exportado') }
  function importFile(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const payload = JSON.parse(String(reader.result)); const valid = payload && Array.isArray(payload.foundIds) && payload.foundIds.every((id: unknown) => typeof id === 'string') && payload.notes && typeof payload.notes === 'object' && !Array.isArray(payload.notes) && Array.isArray(payload.pins) && payload.pins.every((pin: unknown) => { const item = pin as Partial<CustomPin>; return item && typeof item.id === 'string' && Array.isArray(item.coords) && item.coords.length === 2 && typeof item.mapId === 'string' }) ; if (!valid) throw new Error('invalid progress'); importProgress(payload); setToast('Progresso importado com sucesso') } catch { setToast('Não foi possível ler esse arquivo') } }; reader.readAsText(file); event.target.value = '' }
  async function copyLink() { await navigator.clipboard?.writeText(window.location.href.split('?')[0] + `?location=${selected?.id ?? ''}`); setToast('Link do local copiado') }

  return <div className="atlas-app">
    <TopBar activeMap={activeMap} search={search} onSearch={setSearch} onMapChange={setActiveMap} onLogin={() => setLoginOpen(true)} onToggleTheme={toggleTheme} theme={theme} suggestions={visibleFiltered.slice(0, 5)} onChoose={chooseLocation} />
    <div className="workspace">
      <Sidebar open={sidebarOpen} locations={activeLocations} foundIds={foundIds} onToggle={toggleSidebar} onSelect={chooseLocation} onExport={exportProgress} onImport={importFile} />
      <main className={`map-stage ${sidebarOpen ? 'with-sidebar' : ''} ${selected ? 'with-details' : ''}`}>
        <AtlasMap locations={activeLocations} mode={mode} onSelect={setSelected} onAddPin={createPin} focusLocation={selected} />
        <MapToolbar mode={mode} selected={selected} onMode={setMode} onClear={() => useAtlasStore.getState().clearDrawing()} onPlan={() => setRoutePlannerOpen(true)} />
        <ProgressRail found={foundInMap} total={activeLocations.length} categories={activeLocations} foundIds={foundIds} />
      </main>
      {selected && <DetailPanel location={selected} found={foundIds.includes(selected.id)} note={notes[selected.id] ?? ''} onClose={() => setSelected(null)} onToggleFound={() => { toggleFound(selected.id); setToast(foundIds.includes(selected.id) ? 'Local reaberto' : 'Local marcado como encontrado') }} onNote={(note) => setNote(selected.id, note)} onCopy={copyLink} />}
    </div>
    {routePlannerOpen && <RoutePlannerModal locations={activeLocations} foundIds={foundIds} onClose={() => setRoutePlannerOpen(false)} onApply={(points) => { setRoutePoints(points); setToast('Rota calculada e desenhada no mapa') }} />}
    {pinDraft && <PinModal onClose={() => setPinDraft(null)} onSave={savePin} />}
    {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    {toast && <div className="toast" role="status"><Icon name="Check" size={15} /> {toast}</div>}
  </div>
}

function TopBar({ activeMap, search, onSearch, onMapChange, onLogin, onToggleTheme, theme, suggestions, onChoose }: { activeMap: 'skyrim' | 'solstheim'; search: string; onSearch: (value: string) => void; onMapChange: (value: 'skyrim' | 'solstheim') => void; onLogin: () => void; onToggleTheme: () => void; theme: 'dark' | 'light'; suggestions: Location[]; onChoose: (location: Location) => void }) {
  return <header className="topbar"><div className="brand" aria-label="Skyrim Atlas"><span className="brand-mark"><Icon name="Compass" size={20} strokeWidth={1.6} /></span><span><strong>SKYRIM</strong><em>ATLAS</em></span></div><div className="topbar-divider" /><label className="map-select"><span className="eyebrow">MAPA ATIVO</span><select value={activeMap} onChange={(event) => onMapChange(event.target.value as 'skyrim' | 'solstheim')} aria-label="Selecionar mapa"><option value="skyrim">Skyrim</option><option value="solstheim">Solstheim</option></select><Icon name="ChevronDown" size={14} /></label><div className="search-wrap"><Icon name="Search" size={17} /><input id="atlas-search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar um local, item ou região..." aria-label="Buscar locais" /><kbd>F</kbd>{search && <div className="search-suggestions">{suggestions.length ? suggestions.map((location) => <button key={location.id} onClick={() => onChoose(location)}><span className="suggestion-dot" style={{ background: categoryById[location.category].color }} /><span><strong>{location.title}</strong><small>{location.region} · {categoryById[location.category].label}</small></span><Icon name="ChevronRight" size={15} /></button>) : <p>Nenhum ponto encontrado</p>}</div>}</div><div className="top-actions"><button className="icon-button theme-button" onClick={onToggleTheme} aria-label="Alternar tema">{theme === 'dark' ? <Icon name="Sun" size={17} /> : <Icon name="Moon" size={17} />}</button><button className="login-button" onClick={onLogin}><Icon name="LogIn" size={16} /> Entrar</button></div></header>
}

function Sidebar({ open, locations: activeLocations, foundIds, onToggle, onSelect, onExport, onImport }: { open: boolean; locations: Location[]; foundIds: string[]; onToggle: () => void; onSelect: (location: Location) => void; onExport: () => void; onImport: (event: ChangeEvent<HTMLInputElement>) => void }) {
  const { visibleCategories, toggleCategory, setAllCategories, hideFound, setHideFound } = useAtlasStore()
  const [listFilter, setListFilter] = useState('')
  const completion = activeLocations.length ? Math.round((activeLocations.filter((location) => foundIds.includes(location.id)).length / activeLocations.length) * 100) : 0
  const matchesFilter = (label: string) => label.toLowerCase().includes(listFilter.toLowerCase())
  const placeRows = placeFilters.map((filter) => ({ filter, total: activeLocations.filter((location) => location.category === 'places' && location.sourceType === filter.id).length })).filter(({ filter, total }) => total > 0 && matchesFilter(filter.label))
  const categoryRows = categories.filter((category) => matchesFilter(category.label) || (category.id === 'places' && placeRows.length > 0))
  const renderCategory = (category: typeof categories[number]) => {
    const total = activeLocations.filter((location) => location.category === category.id).length
    const found = activeLocations.filter((location) => location.category === category.id && foundIds.includes(location.id)).length
    const visible = visibleCategories[category.id] !== false
    return <div key={category.id}>
      <div className={`category-row ${visible ? '' : 'is-muted'}`}>
        <button className="category-info" onClick={() => toggleCategory(category.id)}><span className="category-icon" style={{ '--category-color': category.color } as React.CSSProperties}><Icon name={categoryIconName[category.id]} size={16} /></span><span className="category-name"><strong>{category.label}</strong><small>{found} / {total} encontrados</small></span></button>
        <button className={`toggle ${visible ? 'is-on' : ''}`} onClick={() => toggleCategory(category.id)} aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${category.label}`}><span /></button>
      </div>
      {category.id === 'places' && <div className="subcategory-list" aria-label="Filtros de tipos de locais">{placeRows.map(({ filter, total: filterTotal }) => {
        const key = placeFilterKey(filter.id)
        const filterVisible = visibleCategories[key] !== false
        const filterFound = activeLocations.filter((location) => location.category === 'places' && location.sourceType === filter.id && foundIds.includes(location.id)).length
        return <div className={`subcategory-row ${filterVisible ? '' : 'is-muted'}`} key={filter.id}><button className="subcategory-info" onClick={() => toggleCategory(key)}><span className="subcategory-icon" style={{ '--subcategory-color': filter.color } as React.CSSProperties}><Icon name={filter.icon as IconName} size={13} /></span><span><strong>{filter.label}</strong><small>{filterFound} / {filterTotal}</small></span></button><button className={`toggle toggle-small ${filterVisible ? 'is-on' : ''}`} onClick={() => toggleCategory(key)} aria-label={`${filterVisible ? 'Ocultar' : 'Mostrar'} ${filter.label}`}><span /></button></div>
      })}</div>}
    </div>
  }
  return <aside className={`sidebar ${open ? 'is-open' : 'is-closed'}`}><div className="sidebar-header"><div><span className="eyebrow">CATÁLOGO DE CAMPO</span><h1>Trilhas à vista</h1></div><button className="icon-button" onClick={onToggle} aria-label="Ocultar sidebar"><Icon name="ChevronLeft" size={17} /></button></div><div className="completion-card"><div className="completion-top"><span>EXPEDIÇÃO ATUAL</span><strong>{completion}%</strong></div><div className="progress-track"><span style={{ width: `${completion}%` }} /></div><p>{foundIds.length} de {activeLocations.length} pontos registrados</p></div><div className="sidebar-tools"><div className="mini-search"><Icon name="Search" size={14} /><input value={listFilter} onChange={(event) => setListFilter(event.target.value)} placeholder="Filtrar tipos de local" aria-label="Filtrar tipos de local" /></div><div className="bulk-actions"><button onClick={() => setAllCategories(true)}>Mostrar todos</button><span>/</span><button onClick={() => setAllCategories(false)}>Ocultar todos</button></div><label className="filter-switch"><input type="checkbox" checked={hideFound} onChange={(event) => setHideFound(event.target.checked)} /><span className="switch-ui" /> Ocultar encontrados</label></div><div className="category-list">{categoryRows.map(renderCategory)}</div><div className="sidebar-footer"><label className="secondary-action"><Icon name="Upload" size={14} /> Importar progresso<input type="file" accept="application/json" onChange={onImport} /></label><button className="secondary-action" onClick={onExport}><Icon name="Download" size={14} /> Exportar progresso</button><p>Pressione <kbd>H</kbd> para ocultar este painel</p></div></aside>
}
function MapToolbar({ mode, selected, onMode, onClear, onPlan }: { mode: string; selected: Location | null; onMode: (mode: 'pin' | 'measure' | 'route' | 'idle') => void; onClear: () => void; onPlan: () => void }) { return <div className="map-toolbar"><div className="tool-section"><button className={`tool-button ${mode === 'pin' ? 'is-active' : ''}`} onClick={() => onMode(mode === 'pin' ? 'idle' : 'pin')} title="Adicionar pin"><Icon name="MapPin" size={17} /><span>Pin pessoal</span></button><button className={`tool-button ${mode === 'measure' ? 'is-active' : ''}`} onClick={() => onMode(mode === 'measure' ? 'idle' : 'measure')} title="Medir distância"><Icon name="Ruler" size={17} /><span>Medir</span></button><button className="tool-button" onClick={onPlan} title="Planejar rota de dungeons"><Icon name="Shuffle" size={17} /><span>Planejar rota</span></button><button className={`tool-button ${mode === 'route' ? 'is-active' : ''}`} onClick={() => onMode(mode === 'route' ? 'idle' : 'route')} title="Desenhar rota manual"><Icon name="Route" size={17} /><span>Rota manual</span></button>{mode !== 'idle' && <button className="tool-button subtle" onClick={onClear}><Icon name="X" size={16} /><span>Limpar</span></button>}</div><div className="tool-section map-utility"><button className="tool-icon" onClick={() => window.dispatchEvent(new Event('atlas-locate'))} aria-label="Localizar no mapa"><Icon name="LocateFixed" size={17} /></button><button className="tool-icon" onClick={() => document.querySelector('.atlas-leaflet')?.requestFullscreen?.()} aria-label="Tela cheia"><Icon name="Maximize2" size={16} /></button></div>{selected && <div className="map-context"><span className="status-dot" /> Local selecionado <strong>{selected.title}</strong></div>}</div> }

function ProgressRail({ found, total, categories: activeLocations, foundIds }: { found: number; total: number; categories: Location[]; foundIds: string[] }) { return <div className="progress-rail"><div className="rail-label"><span><span className="status-dot" /> PROGRESSO</span><strong>{found}/{total}</strong></div><div className="rail-track"><span style={{ width: `${total ? (found / total) * 100 : 0}%` }} /></div><div className="rail-cats">{activeLocations.filter((location, index, self) => self.findIndex((item) => item.category === location.category) === index).slice(0, 4).map((location) => { const list = activeLocations.filter((item) => item.category === location.category); const done = list.filter((item) => foundIds.includes(item.id)).length; return <span key={location.category} title={categoryById[location.category].label}><i style={{ background: categoryById[location.category].color }} /> {done}/{list.length}</span> })}</div></div> }

function DetailPanel({ location, found, note, onClose, onToggleFound, onNote, onCopy }: { location: Location; found: boolean; note: string; onClose: () => void; onToggleFound: () => void; onNote: (value: string) => void; onCopy: () => void }) { const category = categoryById[location.category]; return <aside className="detail-panel"><div className="detail-top"><span className="eyebrow">PONTO DE INTERESSE</span><button className="icon-button" onClick={onClose} aria-label="Fechar detalhes"><Icon name="X" size={17} /></button></div><div className="detail-image" style={{ '--detail-color': category.color } as React.CSSProperties}><span>{location.imageLabel}</span><div className="image-coordinates">{String(location.coords[0]).padStart(3, '0')} / {String(location.coords[1]).padStart(3, '0')}</div><div className="image-spark" /></div><div className="detail-body"><div className="detail-kicker"><span className="category-dot" style={{ background: category.color }} /> {category.label} <span>·</span> {location.region}</div><h2>{location.title}</h2><p className="detail-description">{location.description}</p><div className="tag-row">{location.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div><div className="detail-actions"><button className={`primary-action ${found ? 'is-found' : ''}`} onClick={onToggleFound}><Icon name="Check" size={16} /> {found ? 'Encontrado' : 'Marcar como encontrado'}</button><button className="icon-action" onClick={onCopy} aria-label="Copiar link"><Icon name="Copy" size={16} /></button></div><div className="detail-meta"><span><Icon name="Crosshair" size={14} /> {location.coords[0]}, {location.coords[1]}</span><a href={location.wiki} target="_blank" rel="noreferrer"><Icon name="Globe2" size={14} /> Abrir referência</a></div><div className="note-block"><div className="section-heading"><span>NOTA PESSOAL</span><Icon name="Pencil" size={13} /></div><textarea value={note} onChange={(event) => onNote(event.target.value)} placeholder="Deixe uma pista para a próxima visita..." aria-label="Nota pessoal" /></div></div></aside> }

function PinModal({ onClose, onSave }: { onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) { return <div className="modal-backdrop" role="dialog" aria-modal="true"><form className="modal-card" onSubmit={onSave}><div className="modal-heading"><div><span className="eyebrow">NOVO REGISTRO</span><h2>Adicionar ponto pessoal</h2></div><button type="button" className="icon-button" onClick={onClose}><Icon name="X" size={17} /></button></div><p>Guarde uma marca própria para retornar a este lugar depois.</p><label>Nome do ponto<input autoFocus name="title" defaultValue="Ponto de observação" /></label><div className="form-row"><label>Cor<input type="color" name="color" defaultValue="#f0b35b" /></label><label>Ícone<select name="icon" defaultValue="pin"><option value="pin">Marco</option><option value="camp">Acampamento</option><option value="star">Favorito</option></select></label></div><button className="primary-action" type="submit"><Icon name="Check" size={16} /> Salvar ponto</button></form></div> }

function LoginModal({ onClose }: { onClose: () => void }) { return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="modal-card login-card"><div className="modal-heading"><div><span className="eyebrow">SINCRONIZAÇÃO</span><h2>Entrar no atlas</h2></div><button className="icon-button" onClick={onClose}><Icon name="X" size={17} /></button></div><p>Salve o seu progresso na nuvem e continue a expedição em qualquer dispositivo.</p><button className="oauth-button"><span className="google-mark">G</span> Continuar com Google</button><div className="or-divider"><span>ou use e-mail</span></div><label>E-mail<input type="email" placeholder="explorador@atlas.local" /></label><label>Senha<input type="password" placeholder="••••••••" /></label><button className="primary-action" onClick={onClose}><Icon name="LogIn" size={16} /> Entrar (demo)</button><small className="login-footnote">Modo demo ativo: o progresso local já está salvo neste dispositivo.</small></div></div> }

export { App }

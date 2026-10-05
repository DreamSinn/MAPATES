import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CustomPin, InteractionMode, ViewportState } from '../data/types'
import { allVisibilityKeys, placeFilterKey, placeFilters } from '../data/categories'

interface AtlasState {
  activeMap: 'skyrim' | 'solstheim'
  selectedId: string | null
  foundIds: string[]
  notes: Record<string, string>
  pins: CustomPin[]
  visibleCategories: Record<string, boolean>
  search: string
  hideFound: boolean
  sidebarOpen: boolean
  theme: 'dark' | 'light'
  mode: InteractionMode
  viewportByMap: Record<string, ViewportState>
  measurePoints: [number, number][]
  routePoints: [number, number][]
  setSelected: (id: string | null) => void
  setActiveMap: (map: 'skyrim' | 'solstheim') => void
  toggleFound: (id: string) => void
  setNote: (id: string, note: string) => void
  toggleCategory: (id: string) => void
  setAllCategories: (visible: boolean) => void
  setSearch: (search: string) => void
  setHideFound: (hide: boolean) => void
  toggleSidebar: () => void
  toggleTheme: () => void
  setMode: (mode: InteractionMode) => void
  addPin: (pin: CustomPin) => void
  removePin: (id: string) => void
  setViewport: (map: string, viewport: ViewportState) => void
  addMeasurePoint: (point: [number, number]) => void
  addRoutePoint: (point: [number, number]) => void
  setRoutePoints: (points: [number, number][]) => void
  clearDrawing: () => void
  importProgress: (payload: Pick<AtlasState, 'foundIds' | 'notes' | 'pins'>) => void
}

const defaultCategories = Object.fromEntries(allVisibilityKeys.map((key) => [key, true]))

export const useAtlasStore = create<AtlasState>()(
  persist(
    (set) => ({
      activeMap: 'skyrim', selectedId: null, foundIds: [], notes: {}, pins: [],
      visibleCategories: defaultCategories, search: '', hideFound: false,
      sidebarOpen: true, theme: 'dark', mode: 'idle', measurePoints: [], routePoints: [],
      viewportByMap: { skyrim: { center: [-184, 224], zoom: 1 }, solstheim: { center: [-229, 256], zoom: 1 } },
      setSelected: (selectedId) => set({ selectedId }),
      setActiveMap: (activeMap) => set({ activeMap, selectedId: null }),
      toggleFound: (id) => set((state) => ({ foundIds: state.foundIds.includes(id) ? state.foundIds.filter((item) => item !== id) : [...state.foundIds, id] })),
      setNote: (id, note) => set((state) => ({ notes: { ...state.notes, [id]: note } })),
      toggleCategory: (id) => set((state) => {
        const visible = !state.visibleCategories[id]
        if (id.startsWith('places:')) {
          const placeKeys = placeFilters.map((filter) => placeFilterKey(filter.id))
          const nextPlaces = { ...state.visibleCategories, [id]: visible }
          nextPlaces.places = visible || placeKeys.some((key) => key !== id && nextPlaces[key])
          return { visibleCategories: nextPlaces }
        }
        if (id !== 'places') return { visibleCategories: { ...state.visibleCategories, [id]: visible } }
        return { visibleCategories: { ...state.visibleCategories, places: visible, ...Object.fromEntries(placeFilters.map((filter) => [placeFilterKey(filter.id), visible])) } }
      }),
      setAllCategories: (visible) => set({ visibleCategories: Object.fromEntries(Object.keys(defaultCategories).map((key) => [key, visible])) }),
      setSearch: (search) => set({ search }),
      setHideFound: (hideFound) => set({ hideFound }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setMode: (mode) => set({ mode, measurePoints: [], routePoints: [] }),
      addPin: (pin) => set((state) => ({ pins: [...state.pins, pin], mode: 'idle' })),
      removePin: (id) => set((state) => ({ pins: state.pins.filter((pin) => pin.id !== id) })),
      setViewport: (map, viewport) => set((state) => ({ viewportByMap: { ...state.viewportByMap, [map]: viewport } })),
      addMeasurePoint: (point) => set((state) => ({ measurePoints: [...state.measurePoints, point] })),
      addRoutePoint: (point) => set((state) => ({ routePoints: [...state.routePoints, point] })),
      setRoutePoints: (routePoints) => set({ routePoints, measurePoints: [], mode: 'route' }),
      clearDrawing: () => set({ measurePoints: [], routePoints: [], mode: 'idle' }),
      importProgress: (payload) => set({ foundIds: payload.foundIds ?? [], notes: payload.notes ?? {}, pins: payload.pins ?? [] })
    }),
    { name: 'skyrim-atlas-progress-v5', partialize: (state) => ({ foundIds: state.foundIds, notes: state.notes, pins: state.pins, theme: state.theme, viewportByMap: state.viewportByMap }) }
  )
)

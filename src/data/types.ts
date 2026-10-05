export type CategoryId =
  | 'places'
  | 'collectibles'
  | 'items'
  | 'quests'
  | 'npcs'
  | 'creatures'
  | 'mining'
  | 'plants'

export type InteractionMode = 'idle' | 'pin' | 'measure' | 'route'

export interface Location {
  id: string
  mapId: 'skyrim' | 'solstheim'
  title: string
  category: CategoryId
  sourceType: string
  region: string
  description: string
  coords: [number, number]
  tags: string[]
  wiki: string
  imageLabel: string
}

export interface Category {
  id: CategoryId
  label: string
  icon: string
  color: string
}

export interface CustomPin {
  id: string
  mapId: string
  title: string
  icon: string
  color: string
  coords: [number, number]
  createdAt: string
}

export interface ViewportState {
  center: [number, number]
  zoom: number
}

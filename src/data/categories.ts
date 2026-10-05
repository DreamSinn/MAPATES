import type { Category } from './types'

export const categories: Category[] = [
  { id: 'places', label: 'Locais', icon: 'map', color: '#f0b35b' },
  { id: 'collectibles', label: 'Colecionáveis', icon: 'gem', color: '#c99cff' },
  { id: 'items', label: 'Itens', icon: 'package', color: '#73b6e6' },
  { id: 'quests', label: 'Missões', icon: 'scroll', color: '#f0d36a' },
  { id: 'npcs', label: 'NPCs', icon: 'user', color: '#8dd4af' },
  { id: 'creatures', label: 'Criaturas', icon: 'bug', color: '#ee8b7a' },
  { id: 'mining', label: 'Mineração', icon: 'pickaxe', color: '#c8a98c' },
  { id: 'plants', label: 'Plantas', icon: 'sprout', color: '#82c889' }
]

export const categoryById = Object.fromEntries(categories.map((category) => [category.id, category])) as Record<Category['id'], Category>

export type PlaceFilter = { id: string; label: string; icon: string; color: string }

export const placeFilters: PlaceFilter[] = [
  { id: 'city', label: 'Cidades', icon: 'Landmark', color: '#f0b35b' },
  { id: 'town', label: 'Vilarejos', icon: 'House', color: '#e5c47a' },
  { id: 'village', label: 'Aldeias', icon: 'Trees', color: '#b4cf86' },
  { id: 'camp', label: 'Acampamentos / bandidos', icon: 'TentTree', color: '#d5907c' },
  { id: 'giant-camp', label: 'Acampamentos de gigantes', icon: 'Skull', color: '#c99678' },
  { id: 'imperial-camp', label: 'Acampamentos imperiais', icon: 'Flag', color: '#8ea9d8' },
  { id: 'stormcloak-camp', label: 'Acampamentos Stormcloak', icon: 'Flag', color: '#83b9c5' },
  { id: 'dwemer-ruin', label: 'Ruínas Dwemer', icon: 'Cog', color: '#c8a98c' },
  { id: 'nordic-ruin', label: 'Ruínas nórdicas', icon: 'Mountain', color: '#b2c6d6' },
  { id: 'ruin', label: 'Ruínas', icon: 'Landmark', color: '#9ea7a4' },
  { id: 'cave', label: 'Cavernas', icon: 'CircleDot', color: '#a99ad4' },
  { id: 'mine', label: 'Minas', icon: 'Pickaxe', color: '#c8a98c' },
  { id: 'fort', label: 'Fortes', icon: 'Castle', color: '#d7a56f' },
  { id: 'tower', label: 'Torres', icon: 'Castle', color: '#c9b5da' },
  { id: 'dragon-lair', label: 'Covis de dragão', icon: 'Skull', color: '#ef8e76' },
  { id: 'dragon-mound', label: 'Túmulos de dragão', icon: 'Mountain', color: '#ef8e76' },
  { id: 'shrine', label: 'Santuários', icon: 'Sparkles', color: '#e6c77b' },
  { id: 'daedric-shrine', label: 'Santuários Daédricos', icon: 'Skull', color: '#c98ac8' },
  { id: 'temple', label: 'Templos', icon: 'Church', color: '#e0c6a6' },
  { id: 'house', label: 'Casas', icon: 'House', color: '#b5c9bb' },
  { id: 'farm', label: 'Fazendas', icon: 'Wheat', color: '#d6bd70' },
  { id: 'inn', label: 'Estalagens', icon: 'Beer', color: '#d99b65' },
  { id: 'pass', label: 'Passagens', icon: 'Mountain', color: '#95b5bb' },
  { id: 'shipwreck', label: 'Naufrágios', icon: 'Ship', color: '#7da9ba' },
  { id: 'lighthouse', label: 'Faróis', icon: 'Lightbulb', color: '#f2d38d' },
  { id: 'standing-stone', label: 'Pedras guardiãs', icon: 'Gem', color: '#9dc7cf' },
  { id: 'word-wall', label: 'Muros de palavras', icon: 'ScrollText', color: '#bd9be0' },
  { id: 'grove', label: 'Bosques', icon: 'Trees', color: '#82c889' },
  { id: 'clearing', label: ' Clareiras', icon: 'Trees', color: '#a9c98a' },
  { id: 'cemetery', label: 'Cemitérios', icon: 'Skull', color: '#a99ead' },
  { id: 'dock', label: 'Portos', icon: 'Ship', color: '#7da9ba' },
  { id: 'orc-stronghold', label: 'Fortalezas Orcs', icon: 'Shield', color: '#9caa85' }
]

export const placeFilterById = Object.fromEntries(placeFilters.map((filter) => [filter.id, filter])) as Record<string, PlaceFilter>
export const placeFilterKey = (type: string) => `places:${type}`
export const filterKeyForLocation = (location: { category: string; sourceType: string }) => location.category === 'places' ? placeFilterKey(location.sourceType) : location.category
export const allVisibilityKeys = [...categories.map((category) => category.id), ...placeFilters.map((filter) => placeFilterKey(filter.id))]

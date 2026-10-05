import type { CategoryId } from '../data/types'

export const categoryIcon: Record<CategoryId, 'Map' | 'Gem' | 'Package' | 'ScrollText' | 'UserRound' | 'Bug' | 'Pickaxe' | 'Sprout'> = {
  places: 'Map', collectibles: 'Gem', items: 'Package', quests: 'ScrollText', npcs: 'UserRound', creatures: 'Bug', mining: 'Pickaxe', plants: 'Sprout'
}

export function formatDistance(points: [number, number][]) {
  if (points.length < 2) return '0 m'
  let total = 0
  for (let index = 1; index < points.length; index += 1) {
    const [y1, x1] = points[index - 1]
    const [y2, x2] = points[index]
    total += Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  }
  return total > 1000 ? `${(total / 1000).toFixed(2)} km` : `${Math.round(total)} m`
}

export function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

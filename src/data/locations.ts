import skyrimSource from './source-skyrim.json'
import solstheimSource from './source-solstheim.json'
import type { CategoryId, Location } from './types'

type SourceRow = [string, string, string, number, number, string, string, string, string[]]
type SourceWorld = { world: 'skyrim' | 'solstheim'; rows: SourceRow[] }

export const mapMeta = {
  skyrim: { maxZoom: 6, nativeMaxZoom: 4, imageSize: 8192, contentSize: { width: 7168, height: 5888 }, bounds: [[-512, 0], [0, 512]] as [[number, number], [number, number]], center: [-184, 224] as [number, number], tileAttribution: 'Tiles © UESP (uesp.net), CC BY-SA 2.5; adapted via skyrimmap.com' },
  solstheim: { maxZoom: 6, nativeMaxZoom: 3, imageSize: 4096, contentSize: { width: 4096, height: 3665 }, bounds: [[-512, 0], [0, 512]] as [[number, number], [number, number]], center: [-229, 256] as [number, number], tileAttribution: 'Tiles © UESP (uesp.net), CC BY-SA 2.5; adapted via skyrimmap.com' }
} as const

const serviceTypes = new Set(['blacksmith', 'alchemist', 'general-store', 'jeweler', 'smelter', 'carriage-boat'])
const collectibleTypes = new Set(['dragon-priest-mask', 'stone-of-barenziah', 'skill-book-cache', 'treasure-map', 'treasure-chest', 'unique-item', 'black-book', 'east-empire-pendant'])
const miningTypes = new Set(['mine'])
const plantTypes = new Set(['plant', 'grove'])
const creatureTypes = new Set(['dragon-mound'])
const questTypes = new Set(['quest', 'daedric-quest'])
const npcTypes = new Set(['npc', 'trainer'])

function categoryFor(type: string): CategoryId {
  if (serviceTypes.has(type)) return 'items'
  if (collectibleTypes.has(type)) return 'collectibles'
  if (miningTypes.has(type)) return 'mining'
  if (plantTypes.has(type)) return 'plants'
  if (creatureTypes.has(type)) return 'creatures'
  if (questTypes.has(type)) return 'quests'
  if (npcTypes.has(type)) return 'npcs'
  return 'places'
}

function convert(source: SourceWorld): Location[] {
  const meta = mapMeta[source.world]
  const gameBounds = source.world === 'skyrim'
    ? { minX: -233600, maxX: 225425, minY: -168372, maxY: 208900 }
    : { minX: -24573, maxX: 131078, minY: -12241, maxY: 127000 }
  return source.rows.map(([id, title, type, x, y, hold, description, wiki, tags]) => {
    const pixelX = (x - gameBounds.minX) / (gameBounds.maxX - gameBounds.minX) * meta.contentSize.width
    const scale = 2 ** meta.nativeMaxZoom
    const pixelY = (gameBounds.maxY - y) / (gameBounds.maxY - gameBounds.minY) * meta.contentSize.height / scale
    const category = categoryFor(type)
    return { id, mapId: source.world, title, category, sourceType: type, region: hold || (source.world === 'skyrim' ? 'Skyrim' : 'Solstheim'), description, coords: [-pixelY, pixelX / scale], tags: [...tags, type], wiki, imageLabel: type.replaceAll('-', ' ').toUpperCase() } satisfies Location
  })
}

export const locations = [...convert(skyrimSource as unknown as SourceWorld), ...convert(solstheimSource as unknown as SourceWorld)]

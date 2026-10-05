import express from 'express'
import cors from 'cors'
import { locations } from '../src/data/locations'

const app = express()

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'skyrim-atlas', timestamp: new Date().toISOString() }))
app.get('/api/locations', (req, res) => {
  const map = String(req.query.map || 'skyrim')
  res.json(locations.filter((location) => location.mapId === map))
})
app.get('/api/maps', (_req, res) => res.json([{ id: 'skyrim', name: 'Skyrim' }, { id: 'solstheim', name: 'Solstheim' }]))
app.post('/api/progress/sync', (req, res) => res.json({ ok: true, syncedAt: new Date().toISOString(), received: { foundIds: req.body?.foundIds?.length ?? 0, notes: Object.keys(req.body?.notes ?? {}).length, pins: req.body?.pins?.length ?? 0 } }))

export default app

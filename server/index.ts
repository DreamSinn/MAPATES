import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer as createViteServer } from 'vite'
import app from './app'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const port = Number(process.env.PORT || 3000)

if (process.env.NODE_ENV === 'production') {
  app.use((await import('express')).default.static(path.join(root, 'dist')))
  app.use((_req, res) => res.sendFile(path.join(root, 'dist', 'index.html')))
  app.listen(port, '0.0.0.0', () => console.log(`Skyrim Atlas listening on 0.0.0.0:${port}`))
} else {
  const vite = await createViteServer({ root, server: { middlewareMode: true, hmr: { port: port + 1 } }, appType: 'spa' })
  app.use(vite.middlewares)
  app.listen(port, '0.0.0.0', () => console.log(`Skyrim Atlas dev server on 0.0.0.0:${port}`))
}

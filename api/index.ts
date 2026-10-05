import app from '../server/app'

type VercelRequest = { url?: string; query?: Record<string, string | string[] | undefined> }
type VercelResponse = unknown

export default function handler(req: VercelRequest, res: VercelResponse) {
  const route = req.query?.route
  if (typeof route === 'string') req.url = route
  return (app as unknown as (request: VercelRequest, response: VercelResponse) => unknown)(req, res)
}

import type { APIRequestContext } from '@playwright/test'
import { PNG } from 'pngjs'

import { BASE_URL } from './site'

export const creds = {
  admin: { email: process.env.SEED_ADMIN_EMAIL || '', password: process.env.SEED_ADMIN_PASSWORD || '' },
  editor: { email: process.env.SEED_EDITOR_EMAIL || '', password: process.env.SEED_EDITOR_PASSWORD || '' },
}

/** Logs in over REST and returns an Authorization header (JWT). Never logs the password. */
export const login = async (request: APIRequestContext, who: { email: string; password: string }) => {
  const res = await request.post(`${BASE_URL}/api/users/login`, { data: who })
  if (!res.ok()) throw new Error(`login failed for ${who.email}: ${res.status()}`)
  const body = await res.json()
  return { headers: { Authorization: `JWT ${body.token}` }, user: body.user as { id: number; role: string } }
}

/** A small unique PNG for upload tests. */
export const tinyPng = (rgb: [number, number, number] = [200, 40, 120]) => {
  const png = new PNG({ width: 64, height: 48 })
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = rgb[0]
    png.data[i + 1] = rgb[1]
    png.data[i + 2] = rgb[2]
    png.data[i + 3] = 255
  }
  return PNG.sync.write(png)
}

/** Strips server-managed fields so a document can be written back as-is. */
export const writable = (doc: Record<string, unknown>) => {
  const { id: _id, createdAt: _c, updatedAt: _u, globalType: _g, ...rest } = doc
  return rest
}

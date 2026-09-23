// @vitest-environment node
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { beforeAll, describe, expect, it } from 'vitest'

/** Local API against the local (wrangler-emulated) D1: access rules as seen by anonymous visitors. */
let payload: Payload

describe('Local API access (anonymous, overrideAccess: false)', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  it('sees exactly the 22 published collage pieces, 3 songs, 3 videos', async () => {
    for (const [collection, n] of [['collage', 22], ['songs', 3], ['videos', 3]] as const) {
      const { totalDocs } = await payload.find({ collection, overrideAccess: false, draft: true, limit: 0 })
      expect(totalDocs, collection).toBe(n)
    }
  })

  it('cannot read users', async () => {
    const { docs } = await payload.find({ collection: 'users', overrideAccess: false })
    expect(docs).toHaveLength(0)
  })

  it('cannot read versions', async () => {
    await expect(payload.findGlobalVersions({ slug: 'home-page', overrideAccess: false })).rejects.toThrow()
  })

  it('cannot update a page', async () => {
    await expect(
      payload.updateGlobal({ slug: 'home-page', data: { leadIn: 'x' }, overrideAccess: false }),
    ).rejects.toThrow()
  })
})

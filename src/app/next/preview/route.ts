import config from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { getPayload } from 'payload'

import { safePath } from '../safePath'

/**
 * Entry point for Preview / Live Preview (see src/lib/livePreview.ts): checks the editor is
 * signed in to the CMS, switches on draft mode and opens the page.
 */
export async function GET(request: NextRequest) {
  const path = safePath(request.nextUrl.searchParams.get('path'))
  if (!path) return new Response('Invalid path', { status: 400 })

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return new Response('You need to be signed in to preview.', { status: 401 })

  const draft = await draftMode()
  draft.enable()
  redirect(path)
}

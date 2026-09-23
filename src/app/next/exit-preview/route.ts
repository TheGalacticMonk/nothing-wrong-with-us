import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

import { safePath } from '../safePath'

/** Leaves draft mode and returns to the published version of the page. */
export async function GET(request: NextRequest) {
  const draft = await draftMode()
  draft.disable()
  redirect(safePath(request.nextUrl.searchParams.get('path')) ?? '/')
}

/** Extracts the 11-character video ID from any common YouTube URL form, or a bare ID. */
export const parseYouTubeId = (input: string): string | null => {
  const value = input.trim()
  if (/^[\w-]{11}$/.test(value)) return value
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^(www|m)\./, '')
    if (host === 'youtu.be') return url.pathname.slice(1, 12) || null
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const v = url.searchParams.get('v')
      if (v) return v
      const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/)
      return match?.[1] ?? null
    }
  } catch {
    // Not a URL.
  }
  return null
}

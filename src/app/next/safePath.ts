/** Only same-site relative paths ("/about-me"), never "//evil.example", "/\evil" or absolute URLs. */
export const safePath = (value: string | null): string | null => {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  return value
}

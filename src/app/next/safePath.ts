const BASE = 'http://same-site.invalid'

/**
 * Only same-site relative paths ("/about-me"), never "//evil.example", "/\\evil", "/\t/evil"
 * or absolute URLs. Parsing with the WHATWG URL parser (which strips tabs/newlines and treats
 * backslashes like browsers do) and checking the origin catches every variant.
 */
export const safePath = (value: string | null): string | null => {
  if (!value || !value.startsWith('/')) return null
  let url: URL
  try {
    url = new URL(value, BASE)
  } catch {
    return null
  }
  if (url.origin !== BASE) return null
  return `${url.pathname}${url.search}${url.hash}`
}

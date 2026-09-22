/** The site's four-point star (legacy Star.astro) in orchid on midnight, as a data-URI favicon. */
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
  '<rect width="64" height="64" rx="14" fill="#0a1030"/>' +
  '<path fill="#e086d4" d="M32 6c1.6 14.1 6.3 18.8 26 26-19.7 7.2-24.4 11.9-26 26-1.6-14.1-6.3-18.8-26-26 19.7-7.2 24.4-11.9 26-26z"/>' +
  '</svg>'

export const adminFavicon = `data:image/svg+xml,${encodeURIComponent(svg)}`

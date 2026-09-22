import type { SiteSetting } from '@/payload-types'

/**
 * Support messages from Site Settings. Each returns null when the editor switched it off (or it
 * has no content), and every component that shows one then renders nothing at all.
 */
export const contentNoteText = (settings: SiteSetting | null | undefined) => {
  const note = settings?.safety?.contentNote
  return note?.enabled !== false && note?.text ? note.text : null
}

export const crisisLines = (settings: SiteSetting | null | undefined) => {
  const crisis = settings?.safety?.crisis
  const lines = crisis?.enabled !== false ? (crisis?.lines ?? []) : []
  return lines.length ? lines : null
}

export const legalNoticeText = (settings: SiteSetting | null | undefined) => {
  const notice = settings?.safety?.legalNotice
  return notice?.enabled !== false && notice?.text ? notice.text : null
}

/** Off by default: only shown when explicitly switched on. */
export const quickExitURL = (settings: SiteSetting | null | undefined) => {
  const exit = settings?.safety?.quickExit
  return exit?.enabled === true && exit.url ? exit.url : null
}

export const socialLinks = (settings: SiteSetting | null | undefined) =>
  (settings?.social ?? []).filter((link) => link.label && link.url)

export type SocialLink = { label: string; url: string }

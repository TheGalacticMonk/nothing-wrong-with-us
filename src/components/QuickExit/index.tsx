'use client'

import { useEffect } from 'react'

import styles from './QuickExit.module.css'

/**
 * Leaves immediately and replaces this page in history so Back doesn't return to it.
 * Pressing Escape three times does the same. Rendered only when switched on in Site Settings.
 */
export const QuickExit = ({ url }: { url: string }) => {
  useEffect(() => {
    let presses = 0
    let timer: number | undefined
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      presses += 1
      window.clearTimeout(timer)
      timer = window.setTimeout(() => (presses = 0), 1200)
      if (presses >= 3) window.location.replace(url)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(timer)
    }
  }, [url])

  return (
    <a
      href={url}
      className={`${styles['quick-exit']} label no-print`}
      rel="noopener noreferrer"
      title="Leave this site right away (or press Esc three times)"
      onClick={(event) => {
        event.preventDefault()
        window.location.replace(url)
      }}
    >
      Quick exit <span aria-hidden="true">✕</span>
    </a>
  )
}

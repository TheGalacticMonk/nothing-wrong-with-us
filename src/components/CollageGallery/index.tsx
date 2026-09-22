'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'

import styles from './CollageGallery.module.css'

export interface CollageItem {
  id: number | string
  alt: string
  src: string
  width: number
  height: number
  unoptimized?: boolean
}

/** Gallery grid plus a <dialog> viewer (arrow keys, Previous/Next, backdrop click closes). */
export const CollageGallery = ({ items }: { items: CollageItem[] }) => {
  const dialog = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState(0)
  const count = items.length
  const show = (next: number) => setIndex((next + count) % count)
  const current = items[index]

  return (
    <>
      <div className="wrap">
        <ul className={styles.gallery}>
          {items.map((item, i) => {
            const ratio = item.width / item.height
            const wide = ratio > 1.15
            return (
              <li
                key={item.id}
                className={wide ? styles.wide : undefined}
                data-fit={ratio > 2.2 ? 'contain' : 'cover'}
              >
                <button
                  type="button"
                  className={styles.thumb}
                  aria-haspopup="dialog"
                  onClick={() => {
                    show(i)
                    dialog.current?.showModal()
                  }}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={item.width}
                    height={item.height}
                    unoptimized={item.unoptimized}
                    sizes={
                      wide
                        ? '(min-width: 64rem) 50vw, (min-width: 40rem) 66vw, 100vw'
                        : '(min-width: 64rem) 25vw, (min-width: 40rem) 33vw, 50vw'
                    }
                    quality={wide ? 45 : 60}
                    loading={i < 2 ? 'eager' : 'lazy'}
                    fetchPriority={i < 1 ? 'high' : undefined}
                  />
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <dialog
        ref={dialog}
        id="viewer"
        className={styles.viewer}
        aria-label="Collage viewer"
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') show(index - 1)
          if (event.key === 'ArrowRight') show(index + 1)
        }}
        onClick={(event) => {
          // A click on the backdrop (which targets the dialog element itself) closes it.
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
      >
        <div className={styles['viewer-bar']}>
          <p className="label" id="viewer-count" aria-live="polite">
            {current ? `${index + 1} of ${count}` : ''}
          </p>
          <button
            type="button"
            className={`label ${styles.vbtn}`}
            onClick={() => dialog.current?.close()}
          >
            Close ✕
          </button>
        </div>
        {current && (
          // The original file, full size: the viewer shows it as large as the screen allows.
          // eslint-disable-next-line @next/next/no-img-element
          <img id="viewer-img" src={current.src} alt={current.alt} />
        )}
        <p id="viewer-alt" className={styles['viewer-alt']}>
          {current?.alt}
        </p>
        <div className={styles['viewer-nav']}>
          <button type="button" className={`label ${styles.vbtn}`} onClick={() => show(index - 1)}>
            ← Previous
          </button>
          <button type="button" className={`label ${styles.vbtn}`} onClick={() => show(index + 1)}>
            Next →
          </button>
        </div>
      </dialog>
    </>
  )
}

'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import styles from './YouTubeFacade.module.css'

interface Props {
  id: string
  title: string
  poster: { src: string; width: number; height: number }
}

/**
 * Privacy-first embed: no request reaches YouTube until the visitor chooses to play.
 * Without JavaScript the poster is a plain link to the video on YouTube.
 */
export const YouTubeFacade = ({ id, title, poster }: Props) => {
  const [playing, setPlaying] = useState(false)
  const iframe = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (playing) iframe.current?.focus()
  }, [playing])

  return (
    <div className={styles.yt}>
      {playing ? (
        <iframe
          ref={iframe}
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title || 'Video'}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <a
          className={styles['yt-link']}
          href={`https://www.youtube.com/watch?v=${id}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Play “${title}” video`}
          onClick={(event) => {
            event.preventDefault()
            setPlaying(true)
          }}
        >
          <Image
            src={poster.src}
            width={poster.width}
            height={poster.height}
            alt=""
            sizes="(min-width: 64rem) 40vw, 92vw"
            quality={70}
          />
          <span className={`${styles.play} label`} aria-hidden="true">
            ▶ Play
          </span>
        </a>
      )}
    </div>
  )
}

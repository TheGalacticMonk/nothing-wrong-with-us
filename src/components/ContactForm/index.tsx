'use client'

import { type FormEvent, useEffect, useRef, useState } from 'react'

import styles from './ContactForm.module.css'

type Field = HTMLInputElement | HTMLTextAreaElement

interface Props {
  /** Formspree endpoint. When missing, the form is shown but sending is disabled. */
  action?: string | null
  topics: string[]
}

/**
 * Posts to Formspree. Without JS it is a plain POST with the browser's own validation;
 * with JS it uses accessible inline messages and submits with fetch (same as the Astro script).
 */
export const ContactForm = ({ action, topics }: Props) => {
  const form = useRef<HTMLFormElement>(null)
  const status = useRef<HTMLParagraphElement>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const enhanced = Boolean(action)

  useEffect(() => {
    // Use our own accessible messages; without JS the browser's still apply.
    if (enhanced && form.current) form.current.noValidate = true
  }, [enhanced])

  const validate = (el: Field) => {
    if (el.validity.valid) {
      setErrors((current) => {
        if (!(el.id in current)) return current
        const next = { ...current }
        delete next[el.id]
        return next
      })
      return true
    }
    const text = el.validity.typeMismatch
      ? 'Enter a valid email address, like name@example.com.'
      : (el.dataset.required ?? 'This field is required.')
    setErrors((current) => ({ ...current, [el.id]: text }))
    return false
  }

  const onBlur = (event: { currentTarget: Field }) => {
    if (enhanced) validate(event.currentTarget)
  }
  const onInput = (event: { currentTarget: Field }) => {
    if (enhanced && event.currentTarget.hasAttribute('aria-invalid')) validate(event.currentTarget)
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    if (!enhanced) return
    event.preventDefault()
    const el = event.currentTarget
    const fields = [...el.querySelectorAll<Field>('[data-field]')]
    const invalid = fields.filter((field) => !validate(field))
    if (invalid.length) {
      invalid[0].focus()
      return
    }
    setSending(true)
    setMessage('Sending…')
    try {
      const response = await fetch(el.action, {
        method: 'POST',
        body: new FormData(el),
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error(String(response.status))
      el.reset()
      setMessage('Thank you. Your message has been sent.')
    } catch {
      setMessage('Something went wrong and your message was not sent. Please try again.')
    } finally {
      setSending(false)
      status.current?.focus()
    }
  }

  const fieldProps = (id: string) => ({
    id,
    'data-field': true,
    'aria-describedby': `${id}-error`,
    'aria-invalid': errors[id] ? ('true' as const) : undefined,
    onBlur,
    onInput,
  })
  const error = (id: string) => (
    <p id={`${id}-error`} className="field-error" hidden={!errors[id]}>
      {errors[id]}
    </p>
  )

  return (
    <form
      ref={form}
      action={action ?? undefined}
      method="POST"
      data-unconfigured={action ? undefined : ''}
      className={styles.form}
      aria-labelledby="form-title"
      onSubmit={onSubmit}
    >
      <h2 id="form-title" className="label">
        Send a message
      </h2>

      <div className="field">
        <label htmlFor="cf-name">Your name</label>
        <input
          data-required="Please enter your name."
          name="name"
          type="text"
          autoComplete="name"
          required
          {...fieldProps('cf-name')}
        />
        {error('cf-name')}
      </div>

      <div className="field">
        <label htmlFor="cf-email">Your email</label>
        <input
          data-required="Please enter your email address."
          name="email"
          type="email"
          autoComplete="email"
          required
          {...fieldProps('cf-email')}
        />
        {error('cf-email')}
      </div>

      <div className="field">
        <label htmlFor="cf-topic">What is this about?</label>
        <select id="cf-topic" name="topic">
          {topics.map((topic) => (
            <option key={topic}>{topic}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="cf-message">Message</label>
        <textarea
          data-required="Please write a message."
          name="message"
          rows={6}
          required
          {...fieldProps('cf-message')}
        />
        {error('cf-message')}
      </div>

      {/* Honeypot: real people never see or fill this. */}
      <div className={styles.trap} aria-hidden="true">
        <label>
          Leave this field empty
          <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <p ref={status} className={styles.status} role="status" tabIndex={-1}>
        {message}
      </p>
      <button type="submit" className={`btn ${styles.btn}`} disabled={!action || sending}>
        Send message
      </button>
    </form>
  )
}

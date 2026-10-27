import { Check, Copy, Volume2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { FuriganaPart } from '../lib/japanese'
import { canSpeak, speak } from '../lib/speech'

export function IconButton({
  label,
  onClick,
  children,
  disabled,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  )
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <IconButton
      label={done ? 'Copied' : label}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1200)
        })
      }}
    >
      {done ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
    </IconButton>
  )
}

export function SpeakButton({ text, label = 'Listen' }: { text: string; label?: string }) {
  return (
    <IconButton label={canSpeak ? label : 'Speech is not available in this browser'} onClick={() => speak(text)} disabled={!canSpeak}>
      <Volume2 className="size-4" />
    </IconButton>
  )
}

export function Ruby({ parts }: { parts: FuriganaPart[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.rt ? (
          <ruby key={i}>
            {p.text}
            <rp>(</rp>
            <rt>{p.rt}</rt>
            <rp>)</rp>
          </ruby>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  )
}

const BADGE = {
  neutral: 'bg-secondary text-muted-foreground',
  accent: 'bg-primary/10 text-primary',
  green: 'bg-success/10 text-success',
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof BADGE }) {
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-none ${BADGE[tone]}`}>
      {children}
    </span>
  )
}

/** Placeholder bars for content that is still on its way; `widths` sets one bar per line. */
export function Skeleton({ widths = ['100%'], className = '' }: { widths?: string[]; className?: string }) {
  return (
    <div aria-hidden="true" className={`space-y-2 ${className}`}>
      {widths.map((width, i) => (
        <div key={i} style={{ width }} className="h-5 max-w-full animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`ink-card ${className}`}
    >
      {children}
    </section>
  )
}

/** A pressable chip; its text names what it shows, so it needs no separate label. */
export function ToggleChip({
  pressed,
  onChange,
  children,
  label,
}: {
  pressed: boolean
  onChange: (v: boolean) => void
  children: ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      onClick={() => onChange(!pressed)}
      className={`inline-flex h-8 items-center rounded-lg px-2.5 text-sm font-medium transition ${
        pressed
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { faction } from '../data'
import { playerColor } from '../lib/players'

export function Card({
  title,
  subtitle,
  actions,
  children,
  className = '',
  id,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section
      id={id}
      className={`flex scroll-mt-24 flex-col rounded-2xl border border-line bg-panel/90 p-4 shadow-[0_0_40px_-20px_rgb(168_85_247/0.5)] sm:p-5 ${className}`}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="font-display text-sm font-semibold tracking-wider text-purple-200 uppercase">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-ink-3">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-line bg-space/60 p-0.5 text-xs">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-2.5 py-1.5 font-medium transition-colors ${
            value === o.value ? 'bg-purple-600 text-white' : 'text-ink-2 hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Chip({
  active,
  onClick,
  children,
  color,
  title,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  color?: string
  title?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      title={title}
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
        active
          ? 'border-purple-400 bg-purple-500/25 text-white'
          : 'border-line bg-space/50 text-ink-2 hover:border-purple-400/60 hover:text-ink'
      }`}
    >
      {color && <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
      {children}
    </button>
  )
}

export function PlayerName({ player, className = '' }: { player: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: playerColor(player) }} aria-hidden />
      {player}
    </span>
  )
}

export function FactionIcon({ id, size = 20, className = '' }: { id: string; size?: number; className?: string }) {
  const f = faction(id)
  return (
    <img
      src={`/icons/factions/${encodeURIComponent(f.icon)}.webp`}
      alt=""
      title={f.name}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={`inline-block shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
      onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
    />
  )
}

export function FactionName({ id, size = 18 }: { id: string; size?: number }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <FactionIcon id={id} size={size} />
      <span className="truncate">{id}</span>
    </span>
  )
}

export function FewData({ className = '' }: { className?: string }) {
  return (
    <span
      className={`rounded border border-ink-3/30 px-1 py-px text-[10px] font-medium tracking-wide text-ink-3 uppercase ${className}`}
      title="Wenige Spiele: Werte schwanken stark"
    >
      wenig Daten
    </span>
  )
}

export function Empty({ children = 'Keine Spiele für diese Filter.' }: { children?: ReactNode }) {
  return <p className="py-8 text-center text-sm text-ink-3">{children}</p>
}

/** Small W/L marker used for "form" and lists. */
export function ResultDot({ won, title }: { won: boolean; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-block size-3 rounded-full ${won ? 'bg-gold shadow-[0_0_6px_rgb(245_197_66/0.6)]' : 'border border-ink-3/60'}`}
      aria-label={won ? 'Sieg' : 'Niederlage'}
    />
  )
}

/**
 * Native <dialog>: focus trap, Esc and inert background for free.
 * Renders as a bottom sheet on phones and a centered panel on larger screens.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  labelledBy: string
  children: ReactNode
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className={`m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-hidden rounded-t-2xl border border-line bg-panel p-0 text-ink shadow-2xl sm:m-auto sm:rounded-2xl ${
        wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'
      }`}
    >
      {open && <div className="flex max-h-[88dvh] flex-col">{children}</div>}
    </dialog>
  )
}

export function ModalHeader({ id, children, onClose, actions }: { id: string; children: ReactNode; onClose: () => void; actions?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-line p-4">
      <div id={id} className="min-w-0 flex-1">
        {children}
      </div>
      {actions}
      <button onClick={onClose} className="-m-1 rounded-lg p-2 text-ink-3 hover:bg-white/5 hover:text-ink" aria-label="Schließen">
        <X size={20} />
      </button>
    </div>
  )
}

/** Horizontal bar for a rate with a tick at the expected value. */
export function RateBar({
  value,
  expected,
  color = 'var(--color-cat-1)',
  dim = false,
}: {
  value: number
  expected?: number
  color?: string
  dim?: boolean
}) {
  return (
    <div className={`relative h-3 w-full rounded-full bg-white/5 ${dim ? 'opacity-45' : ''}`}>
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width: `${Math.max(value * 100, value > 0 ? 2 : 0)}%`, backgroundColor: color }}
      />
      {expected !== undefined && (
        <div
          className="absolute -inset-y-1 w-0.5 rounded bg-ink"
          style={{ left: `calc(${expected * 100}% - 1px)` }}
          title={`Erwartung ${Math.round(expected * 100)} %`}
        />
      )}
    </div>
  )
}

/** Diverging bar centered on zero: wins above / below expectation. */
export function DivergingBar({ value, max }: { value: number; max: number }) {
  const w = max > 0 ? Math.min(Math.abs(value) / max, 1) * 50 : 0
  return (
    <div className="relative h-3 w-full rounded-full bg-white/5" aria-hidden>
      <div className="absolute inset-y-[-3px] left-1/2 w-px bg-ink-3/70" />
      <div
        className="absolute inset-y-0 rounded-full"
        style={{
          width: `${w}%`,
          left: value >= 0 ? '50%' : `${50 - w}%`,
          backgroundColor: value >= 0 ? 'var(--color-better)' : 'var(--color-worse)',
        }}
      />
    </div>
  )
}

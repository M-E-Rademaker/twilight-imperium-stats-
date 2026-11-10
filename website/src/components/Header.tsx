import { dataset } from '../data'
import { fmtDate } from '../lib/format'

export function Header() {
  const last = dataset.games.at(-1)
  return (
    <header className="pt-8 pb-6 text-center sm:pt-12">
      <p className="font-display text-xs tracking-[0.35em] text-purple-300/80 uppercase">Gruppenstatistik</p>
      <h1 className="mt-2 bg-gradient-to-r from-purple-300 via-fuchsia-300 to-pink-300 bg-clip-text font-display text-3xl font-bold tracking-wide text-transparent sm:text-5xl">
        Twilight Imperium
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-sm text-ink-3">
        Gebaut von <span className="text-ink-2">Manuel Rademaker</span> mit Hilfe seines Freundes{' '}
        <span className="text-ink-2">Claude Code</span> 🦞 · Daten von <span className="text-ink-2">Eric Holfert</span>
      </p>
      {last && (
        <p className="mt-2 text-xs text-ink-3">
          {dataset.games.length} Spiele · letztes Spiel beendet am <span className="text-purple-200">{fmtDate(last.end)}</span>
        </p>
      )}
    </header>
  )
}

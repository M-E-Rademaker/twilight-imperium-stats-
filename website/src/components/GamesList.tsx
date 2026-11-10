import { useDeferredValue, useMemo, useState } from 'react'
import { ChevronRight, Search, Trophy } from 'lucide-react'
import type { Game } from '../data/types'
import { fmtDate } from '../lib/format'
import { playerColor } from '../lib/players'
import { Card, Empty, FactionIcon } from './ui'

const PAGE = 12

export function GamesList({ games, onOpenGame }: { games: Game[]; onOpenGame: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const q = useDeferredValue(query.trim().toLowerCase())

  const list = useMemo(() => {
    const newestFirst = [...games].reverse()
    if (!q) return newestFirst
    return newestFirst.filter(
      (g) => g.name.toLowerCase().includes(q) || g.results.some((r) => r.player.toLowerCase().includes(q) || r.faction.toLowerCase().includes(q)),
    )
  }, [games, q])
  const visible = showAll || q ? list : list.slice(0, PAGE)

  return (
    <Card
      id="spiele"
      title="Spiele"
      subtitle={`${list.length} ${list.length === 1 ? 'Spiel' : 'Spiele'}, neueste zuerst`}
      actions={
        <label className="relative block w-full sm:w-64">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, Spieler, Fraktion …"
            aria-label="Spiele durchsuchen"
            className="w-full rounded-xl border border-line bg-space/60 py-2 pr-3 pl-9 text-base text-ink placeholder:text-ink-3 focus:border-purple-400 focus:outline-none sm:text-sm"
          />
        </label>
      }
      className="lg:col-span-3"
    >
      {visible.length === 0 ? (
        <Empty />
      ) : (
        <ul className="divide-y divide-line/50">
          {visible.map((g) => (
            <li key={g.id}>
              <button onClick={() => onOpenGame(g.id)} className="group flex w-full items-center gap-3 rounded-lg px-1 py-3 text-left hover:bg-white/5 sm:px-2">
                <span className="hidden w-8 shrink-0 font-display text-xs text-ink-3 tabular sm:block">#{g.index}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink group-hover:text-white">{g.name}</span>
                  <span className="mt-0.5 block text-xs text-ink-3">
                    {fmtDate(g.end)} · {g.nPlayers} Spieler · {g.maxVp} VP · {g.rounds} Runden
                  </span>
                </span>
                {/* finishing order as faction icons, underlined in player color */}
                <span className="hidden shrink-0 items-end gap-1.5 md:flex" aria-hidden>
                  {g.results.map((r) => (
                    <span key={r.player} className="flex flex-col items-center gap-1" title={`${r.player} · ${r.faction} · ${r.vp} VP`}>
                      <FactionIcon id={r.faction} size={r.winner ? 26 : 20} className={r.winner ? '' : 'opacity-70'} />
                      <span className="h-0.5 w-4 rounded" style={{ backgroundColor: playerColor(r.player) }} />
                    </span>
                  ))}
                </span>
                <span className="flex w-28 shrink-0 items-center justify-end gap-1.5 text-sm sm:w-32">
                  <Trophy size={14} className="shrink-0 text-gold" />
                  <span className="truncate font-medium" style={{ color: 'var(--color-ink)' }}>
                    {g.winner}
                  </span>
                  <FactionIcon id={g.results[0]!.faction} size={20} className="md:hidden" />
                </span>
                <ChevronRight size={16} className="shrink-0 text-ink-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {!showAll && !q && list.length > PAGE && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 w-full rounded-xl border border-line py-2.5 text-sm text-purple-200 hover:border-purple-400/60 hover:bg-purple-500/10"
        >
          Alle {list.length} Spiele anzeigen
        </button>
      )}
    </Card>
  )
}

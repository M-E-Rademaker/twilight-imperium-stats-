import { useMemo, useState } from 'react'
import { dataset } from '../data'
import type { Game } from '../data/types'
import { fmtPct0 } from '../lib/format'
import { playerColor } from '../lib/players'
import { headToHead, type Duel } from '../lib/stats'
import { Card, Empty, PlayerName } from './ui'

const MIN_SHARED = 3

/** Background tint for a cell: mint above 50 %, rose below, neutral at 50 %. */
function tint(share: number): string {
  const d = share - 0.5
  const alpha = Math.min(Math.abs(d) * 1.6, 0.55)
  return d >= 0 ? `rgb(52 211 153 / ${alpha})` : `rgb(251 113 133 / ${alpha})`
}

export function HeadToHead({ games }: { games: Game[] }) {
  const [hover, setHover] = useState<{ a: string; b: string; d: Duel } | null>(null)

  const players = useMemo(() => {
    const count = new Map<string, number>()
    for (const g of games) for (const r of g.results) count.set(r.player, (count.get(r.player) ?? 0) + 1)
    return dataset.players.filter((p) => (count.get(p) ?? 0) >= MIN_SHARED)
  }, [games])
  const matrix = useMemo(() => headToHead(games, players), [games, players])

  const describe = (a: string, b: string, d: Duel) =>
    `${a} landete in ${d.ahead.toLocaleString('de-DE')} von ${d.shared} gemeinsamen Spielen vor ${b} (${fmtPct0(d.ahead / d.shared)}). ${a} gewann davon ${d.wins}.`

  return (
    <Card id="duelle" title="Duelle" subtitle="Wie oft landet die Zeile vor der Spalte? Gleichstand zählt halb.">
      {players.length < 2 ? (
        <Empty>Zu wenige gemeinsame Spiele.</Empty>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0.5 text-sm sm:border-spacing-1">
              <thead>
                <tr>
                  <th className="sr-only">Spieler</th>
                  {players.map((b) => (
                    <th key={b} scope="col" className="pb-1 text-xs font-normal text-ink-3">
                      <span className="inline-flex flex-col items-center gap-1">
                        <span className="size-2 rounded-full" style={{ backgroundColor: playerColor(b) }} />
                        {b}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map((a) => (
                  <tr key={a}>
                    <th scope="row" className="pr-1 text-left text-xs font-normal whitespace-nowrap text-ink-2">
                      <PlayerName player={a} />
                    </th>
                    {players.map((b) => {
                      const d = matrix.get(a)?.get(b)
                      if (a === b) return <td key={b} className="rounded-md bg-white/[0.03]" aria-hidden />
                      if (!d || d.shared < MIN_SHARED)
                        return (
                          <td key={b} className="rounded-md bg-white/[0.03] text-center text-xs text-ink-3">
                            –
                          </td>
                        )
                      const share = d.ahead / d.shared
                      return (
                        <td
                          key={b}
                          tabIndex={0}
                          title={describe(a, b, d)}
                          onMouseEnter={() => setHover({ a, b, d })}
                          onFocus={() => setHover({ a, b, d })}
                          onClick={() => setHover({ a, b, d })}
                          onMouseLeave={() => setHover(null)}
                          className="h-11 min-w-10 rounded-md text-center tabular outline-offset-0 sm:min-w-12"
                          style={{ backgroundColor: tint(share) }}
                        >
                          <span className="block text-xs font-semibold text-ink sm:text-sm">{fmtPct0(share)}</span>
                          <span className="block text-[10px] text-ink-2">n={d.shared}</span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 min-h-10 text-xs text-ink-3" aria-live="polite">
            {hover ? describe(hover.a, hover.b, hover.d) : 'Zelle antippen oder überfahren für Details.'}
          </p>
        </>
      )}
    </Card>
  )
}

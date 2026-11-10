import { useMemo } from 'react'
import type { Row } from '../lib/filters'
import { fmtPct0, fmtSigned } from '../lib/format'
import { MIN_GROUP_GAMES, seatStats } from '../lib/stats'
import { Card, Empty, FewData, RateBar } from './ui'

export function SeatChart({ rows }: { rows: Row[] }) {
  const seats = useMemo(() => seatStats(rows), [rows])
  return (
    <Card id="startposition" title="Startposition" subtitle="Bringt es etwas, früh dran zu sein? Strich = Erwartung bei gleichen Chancen.">
      {seats.length === 0 ? (
        <Empty />
      ) : (
        <ul className="space-y-3">
          {seats.map((s) => (
            <li key={s.seat}>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-ink">Platz {s.seat}</span>
                {s.games < MIN_GROUP_GAMES && <FewData />}
                <span className="ml-auto text-xs text-ink-3 tabular">
                  {s.wins}/{s.games}
                </span>
                <span className={`w-10 text-right text-xs font-semibold tabular ${s.wae >= 0 ? 'text-better' : 'text-worse'}`}>{fmtSigned(s.wae)}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <RateBar value={s.winRate} expected={s.expectedRate} dim={s.games < MIN_GROUP_GAMES} />
                <span className="w-10 shrink-0 text-right text-xs text-ink-2 tabular">{fmtPct0(s.winRate)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

import { useMemo, useState } from 'react'
import { dataset } from '../data'
import type { Row } from '../lib/filters'
import { dateValue, fmtDate } from '../lib/format'
import { playerColor } from '../lib/players'
import { useElementWidth } from '../hooks/useElementWidth'
import { Card, Empty, FactionIcon } from './ui'

const ROW_H = 30
const TOP = 6
const AXIS_H = 24

interface Hover {
  x: number
  y: number
  row: Row
}

export function ActivityTimeline({ rows, onOpenGame }: { rows: Row[]; onOpenGame: (id: string) => void }) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const [hover, setHover] = useState<Hover | null>(null)

  const players = useMemo(() => {
    const present = new Set(rows.map((r) => r.result.player))
    return dataset.players.filter((p) => present.has(p))
  }, [rows])

  const labelW = width < 480 ? 58 : 72
  const x0 = labelW + 10
  const x1 = Math.max(x0 + 50, width - 12)
  const tMin = rows.length ? dateValue(rows[0]!.game.end) : 0
  const tMax = rows.length ? Math.max(dateValue(rows.at(-1)!.game.end), tMin + 86_400_000 * 30) : 1
  const x = (iso: string) => x0 + ((dateValue(iso) - tMin) / (tMax - tMin)) * (x1 - x0)
  const height = TOP + players.length * ROW_H + AXIS_H

  const yearsInRange: number[] = []
  for (let y = new Date(tMin).getUTCFullYear() + 1; y <= new Date(tMax).getUTCFullYear(); y++) yearsInRange.push(y)

  return (
    <Card
      id="aktivitaet"
      title="Aktivität"
      subtitle="Jeder Punkt ist ein Spiel (am Enddatum), große Punkte mit goldenem Ring sind Siege. Antippen öffnet das Spiel."
      className="lg:col-span-3"
    >
      <div ref={ref} className="relative" onMouseLeave={() => setHover(null)}>
        {!rows.length && <Empty />}
        {rows.length > 0 && (
        <svg width={width} height={height} role="img" aria-label="Spiele pro Spieler über die Zeit" className="block overflow-visible">
          {yearsInRange.map((y) => {
            const xi = x(`${y}-01-01`)
            return (
              <g key={y}>
                <line x1={xi} x2={xi} y1={TOP} y2={height - AXIS_H} stroke="rgb(255 255 255 / 0.1)" strokeDasharray="3 4" />
                <text x={xi} y={height - 6} textAnchor="middle" fontSize={11} fill="var(--color-ink-3)">
                  {y}
                </text>
              </g>
            )
          })}
          {players.map((p, i) => {
            const cy = TOP + i * ROW_H + ROW_H / 2
            const color = playerColor(p)
            const mine = rows.filter((r) => r.result.player === p)
            return (
              <g key={p}>
                <text x={0} y={cy + 4} fontSize={12} fill="var(--color-ink-2)">
                  {p}
                </text>
                <line x1={x0} x2={x1} y1={cy} y2={cy} stroke="rgb(255 255 255 / 0.07)" />
                {mine
                  .filter((r) => !r.result.winner)
                  .map((r) => (
                    <circle key={r.game.id} cx={x(r.game.end)} cy={cy} r={4} fill={color} fillOpacity={0.55} />
                  ))}
                {mine
                  .filter((r) => r.result.winner)
                  .map((r) => (
                    <circle key={r.game.id} cx={x(r.game.end)} cy={cy} r={6} fill={color} stroke="var(--color-gold)" strokeWidth={2} />
                  ))}
                {/* generous invisible hit targets */}
                {mine.map((r) => (
                  <circle
                    key={`hit-${r.game.id}`}
                    cx={x(r.game.end)}
                    cy={cy}
                    r={10}
                    fill="transparent"
                    className="cursor-pointer"
                    tabIndex={0}
                    role="button"
                    aria-label={`${r.game.name}, ${p}: ${r.result.winner ? 'Sieg' : `${r.result.vp} Punkte`}`}
                    onMouseEnter={() => setHover({ x: x(r.game.end), y: cy, row: r })}
                    onFocus={() => setHover({ x: x(r.game.end), y: cy, row: r })}
                    onClick={() => onOpenGame(r.game.id)}
                    onKeyDown={(e) => e.key === 'Enter' && onOpenGame(r.game.id)}
                  />
                ))}
              </g>
            )
          })}
        </svg>
        )}
        {hover && rows.length > 0 && (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-60 -translate-x-1/2 rounded-xl border border-line bg-panel/95 px-3 py-2 text-xs shadow-xl"
            style={{
              left: Math.min(Math.max(hover.x, 110), width - 110),
              top: hover.y > height / 2 ? hover.y - 12 : hover.y + 14,
              transform: `translate(-50%, ${hover.y > height / 2 ? '-100%' : '0'})`,
            }}
          >
            <div className="font-medium text-ink">{hover.row.game.name}</div>
            <div className="text-ink-3">{fmtDate(hover.row.game.end)}</div>
            <div className="mt-1 flex items-center gap-1.5 text-ink-2">
              <FactionIcon id={hover.row.result.faction} size={16} />
              {hover.row.result.player}: {hover.row.result.vp}/{hover.row.game.maxVp}
              {hover.row.result.winner ? ' · Sieg' : ` · Sieger ${hover.row.game.winner}`}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

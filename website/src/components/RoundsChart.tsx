import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import type { Game } from '../data/types'
import { Card, Empty } from './ui'

const SERIES = [
  { vp: 10, color: 'var(--color-cat-1)' },
  { vp: 14, color: 'var(--color-cat-2)' },
]

export function RoundsChart({ games }: { games: Game[] }) {
  const data = useMemo(() => {
    if (!games.length) return []
    const rounds = games.map((g) => g.rounds)
    const out = []
    for (let r = Math.min(...rounds); r <= Math.max(...rounds); r++) {
      const row: Record<string, number> = { round: r }
      for (const s of SERIES) row[`vp${s.vp}`] = games.filter((g) => g.rounds === r && g.maxVp === s.vp).length
      out.push(row)
    }
    return out
  }, [games])
  const series = SERIES.filter((s) => games.some((g) => g.maxVp === s.vp))

  return (
    <Card id="runden" title="Spiellänge" subtitle="In welcher Runde endeten die Spiele?">
      {data.length === 0 ? (
        <Empty />
      ) : (
        <>
          {series.length > 1 && (
            <ul className="mb-2 flex gap-4 text-xs text-ink-2">
              {series.map((s) => (
                <li key={s.vp} className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                  {s.vp} VP
                </li>
              ))}
            </ul>
          )}
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -28 }} barCategoryGap="20%">
                <CartesianGrid stroke="rgb(255 255 255 / 0.06)" vertical={false} />
                <XAxis dataKey="round" tick={{ fill: 'var(--color-ink-3)', fontSize: 12 }} stroke="rgb(255 255 255 / 0.15)" tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--color-ink-3)', fontSize: 12 }} stroke="transparent" />
                <Tooltip content={RoundsTooltip} cursor={{ fill: 'rgb(255 255 255 / 0.05)' }} />
                {series.map((s, i) => (
                  <Bar
                    key={s.vp}
                    dataKey={`vp${s.vp}`}
                    name={`${s.vp} VP`}
                    stackId="a"
                    fill={s.color}
                    stroke="var(--color-panel)"
                    strokeWidth={1}
                    radius={i === series.length - 1 ? [4, 4, 0, 0] : 0}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  )
}

function RoundsTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, e) => s + Number(e.value ?? 0), 0)
  return (
    <div className="rounded-xl border border-line bg-panel/95 px-3 py-2 text-xs shadow-xl">
      <div className="font-medium text-ink">
        Runde {label}: {total} {total === 1 ? 'Spiel' : 'Spiele'}
      </div>
      {payload.length > 1 &&
        payload.map((e) => (
          <div key={String(e.dataKey)} className="flex gap-3 text-ink-2">
            {e.name}
            <span className="ml-auto text-ink tabular">{String(e.value)}</span>
          </div>
        ))}
    </div>
  )
}

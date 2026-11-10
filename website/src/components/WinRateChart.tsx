import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import { dataset } from '../data'
import type { Row } from '../lib/filters'
import { fmtDate, fmtMonth, fmtPct, fmtPct0, fmtSigned } from '../lib/format'
import { playerColor } from '../lib/players'
import { WIN_RATE_WARMUP, winRateTimeline } from '../lib/stats'
import { Card, Empty, Segmented } from './ui'

type Metric = 'wr' | 'wae'

const AXIS = { stroke: 'var(--color-ink-3)', fontSize: 12 }

function yearTicks(min: number, max: number): number[] {
  const ticks: number[] = []
  const start = new Date(min)
  for (let y = start.getUTCFullYear(); y <= new Date(max).getUTCFullYear() + 1; y++) {
    for (const m of [0, 6]) {
      const t = Date.UTC(y, m, 1)
      if (t >= min && t <= max) ticks.push(t)
    }
  }
  return ticks
}

export function WinRateChart({ rows }: { rows: Row[] }) {
  const [metric, setMetric] = useState<Metric>('wae')
  const [hidden, setHidden] = useState<string[]>([])

  const points = useMemo(() => winRateTimeline(rows), [rows])
  const players = useMemo(() => {
    const present = new Set(rows.map((r) => r.result.player))
    return dataset.players.filter((p) => present.has(p))
  }, [rows])
  const visible = players.filter((p) => !hidden.includes(p) && points.some((pt) => pt[metric][p] !== undefined))

  const data = useMemo(
    () => points.map((pt) => ({ t: pt.t, name: pt.name, ...pt[metric] })),
    [points, metric],
  )
  const lastIndex = useMemo(() => {
    const out: Record<string, number> = {}
    data.forEach((d, i) => {
      for (const p of players) if ((d as Record<string, unknown>)[p] !== undefined) out[p] = i
    })
    return out
  }, [data, players])

  const baseline = rows.length ? rows.reduce((s, r) => s + 1 / r.game.nPlayers, 0) / rows.length : 0
  const fmt = metric === 'wr' ? fmtPct0 : fmtSigned
  const labelLines = visible.length <= 4
  const ticks = data.length ? yearTicks(data[0]!.t, data.at(-1)!.t) : []

  return (
    <Card
      id="verlauf"
      title="Verlauf"
      subtitle={
        metric === 'wae'
          ? 'Kumulierte Siege über Erwartung. Steigt die Linie, gewinnt der Spieler öfter als der Zufall.'
          : `Kumulierte Win-Rate, jeweils ab dem ${WIN_RATE_WARMUP}. Spiel eines Spielers.`
      }
      actions={
        <Segmented
          label="Kennzahl"
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'wae', label: 'Über Erwartung' },
            { value: 'wr', label: 'Win-Rate' },
          ]}
        />
      }
      className="lg:col-span-2"
    >
      {data.length < 2 ? (
        <Empty />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Spieler ein- und ausblenden">
            {players.map((p) => {
              const on = !hidden.includes(p)
              return (
                <button
                  key={p}
                  aria-pressed={on}
                  onClick={() => setHidden((h) => (on ? [...h, p] : h.filter((x) => x !== p)))}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                    on ? 'border-line text-ink' : 'border-transparent text-ink-3 line-through opacity-60'
                  }`}
                >
                  <span className="h-0.5 w-3.5 rounded" style={{ backgroundColor: playerColor(p) }} />
                  {p}
                </button>
              )
            })}
          </div>
          <div className="h-72 flex-1 sm:min-h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: labelLines ? 56 : 12, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="rgb(255 255 255 / 0.06)" vertical={false} />
                <XAxis
                  dataKey="t"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  ticks={ticks}
                  tickFormatter={(t: number) => fmtMonth(t)}
                  tick={AXIS}
                  stroke="rgb(255 255 255 / 0.15)"
                  tickLine={false}
                />
                <YAxis
                  tick={AXIS}
                  tickFormatter={(v: number) => fmt(v)}
                  stroke="transparent"
                  width={52}
                  domain={metric === 'wr' ? [0, 'auto'] : ['auto', 'auto']}
                  allowDecimals={metric === 'wr'}
                />
                <ReferenceLine
                  y={metric === 'wr' ? baseline : 0}
                  stroke="var(--color-ink-3)"
                  strokeDasharray="4 4"
                  label={{
                    value: metric === 'wr' ? `Zufall ≈ ${fmtPct0(baseline)}` : 'Erwartung',
                    position: 'insideBottomLeft',
                    fill: 'var(--color-ink-3)',
                    fontSize: 11,
                  }}
                />
                <Tooltip content={(props) => <ChartTooltip {...props} metric={metric} />} cursor={{ stroke: 'rgb(255 255 255 / 0.25)' }} />
                {visible.map((p) => (
                  <Line
                    key={p}
                    dataKey={p}
                    name={p}
                    type="linear"
                    stroke={playerColor(p)}
                    strokeWidth={2}
                    connectNulls
                    isAnimationActive={false}
                    activeDot={{ r: 5, stroke: 'var(--color-panel)', strokeWidth: 2 }}
                    dot={(props: { cx?: number; cy?: number; index?: number }) => {
                      const { cx, cy, index } = props
                      if (!labelLines || index !== lastIndex[p] || cx == null || cy == null) return <g key={`${p}-${index}`} />
                      return (
                        <g key={`${p}-end`}>
                          <circle cx={cx} cy={cy} r={3.5} fill={playerColor(p)} stroke="var(--color-panel)" strokeWidth={2} />
                          <text x={cx + 7} y={cy + 4} fontSize={12} fill="var(--color-ink-2)">
                            {p}
                          </text>
                        </g>
                      )
                    }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  )
}

function ChartTooltip({ active, payload, metric }: TooltipContentProps & { metric: Metric }) {
  if (!active || !payload?.length) return null
  const d = payload[0]!.payload as { t: number; name: string }
  const entries = [...payload].filter((e) => typeof e.value === 'number').sort((a, b) => Number(b.value) - Number(a.value))
  return (
    <div className="rounded-xl border border-line bg-panel/95 px-3 py-2 text-xs shadow-xl">
      <div className="font-medium text-ink">{d.name}</div>
      <div className="mb-1.5 text-ink-3">beendet {fmtDate(d.t)}</div>
      {entries.map((e) => (
        <div key={String(e.dataKey)} className="flex items-center gap-2 py-0.5">
          <span className="h-0.5 w-3 rounded" style={{ backgroundColor: e.color }} />
          <span className="text-ink-2">{e.name}</span>
          <span className="ml-auto pl-4 font-medium text-ink tabular">{metric === 'wr' ? fmtPct(Number(e.value)) : fmtSigned(Number(e.value))}</span>
        </div>
      ))}
    </div>
  )
}

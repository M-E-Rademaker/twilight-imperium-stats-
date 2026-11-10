import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDown } from 'lucide-react'
import type { Row } from '../lib/filters'
import { fmtPct, fmtPct0, fmtSigned } from '../lib/format'
import { MIN_PLAYER_GAMES, playerStats, type PlayerStat } from '../lib/stats'
import { Card, DivergingBar, Empty, FactionIcon, FewData, PlayerName, ResultDot } from './ui'

type SortKey = 'wae' | 'winRate' | 'games' | 'wins' | 'avgVpShare'

const COLUMNS: { key: SortKey; label: string; title: string }[] = [
  { key: 'games', label: 'Spiele', title: 'Gespielte Partien' },
  { key: 'wins', label: 'Siege', title: 'Gewonnene Partien' },
  { key: 'winRate', label: 'Win-Rate', title: 'Siege / Spiele (darunter: erwartete Rate bei gleichen Chancen)' },
  { key: 'wae', label: 'Über Erwartung', title: 'Siege minus erwartete Siege (1 / Spielerzahl je Partie)' },
  { key: 'avgVpShare', label: 'Ø Punkte', title: 'Durchschnittlich erreichter Anteil der Siegpunkte' },
]

export function Leaderboard({ rows, onOpenGame }: { rows: Row[]; onOpenGame: (id: string) => void }) {
  const [sort, setSort] = useState<SortKey>('wae')
  const stats = useMemo(() => playerStats(rows), [rows])
  const sorted = useMemo(
    () =>
      [...stats].sort((a, b) => {
        // players with too few games are listed, but below the ranked ones
        const few = Number(a.games < MIN_PLAYER_GAMES) - Number(b.games < MIN_PLAYER_GAMES)
        return few || b[sort] - a[sort] || b.wae - a.wae
      }),
    [stats, sort],
  )
  const rank = (s: PlayerStat, i: number) => (s.games < MIN_PLAYER_GAMES ? '–' : i + 1)
  const maxWae = Math.max(1, ...stats.map((s) => Math.abs(s.wae)))

  return (
    <Card
      id="rangliste"
      title="Rangliste"
      subtitle={
        <>
          „Über Erwartung“ = Siege minus Siege, die man bei gleichen Chancen hätte (⅓ im 3er-, ¼ im 4er-Spiel …). Fair über
          alle Spielerzahlen hinweg.
        </>
      }
    >
      {sorted.length === 0 ? (
        <Empty />
      ) : (
        <>
          {/* phones: cards */}
          <ol className="space-y-2.5 md:hidden">
            {sorted.map((s, i) => (
              <li key={s.player} className="rounded-xl border border-line bg-space/40 p-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 font-display text-sm text-ink-3 tabular">{rank(s, i)}</span>
                  <PlayerName player={s.player} className="font-semibold" />
                  {s.games < MIN_PLAYER_GAMES && <FewData />}
                  <span className={`ml-auto font-semibold tabular ${s.wae >= 0 ? 'text-better' : 'text-worse'}`}>{fmtSigned(s.wae)}</span>
                </div>
                <div className="mt-2 pl-7">
                  <DivergingBar value={s.wae} max={maxWae} />
                </div>
                <dl className="mt-2.5 grid grid-cols-4 gap-1 pl-7 text-xs">
                  <Stat label="Spiele" value={s.games} />
                  <Stat label="Siege" value={s.wins} />
                  <Stat label="Win-Rate" value={fmtPct0(s.winRate)} sub={`erw. ${fmtPct0(s.expectedRate)}`} />
                  <Stat label="Ø Punkte" value={fmtPct0(s.avgVpShare)} />
                </dl>
                <Extras s={s} onOpenGame={onOpenGame} />
              </li>
            ))}
          </ol>

          {/* tablet & desktop: table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-3">
                  <th className="w-8 py-2 font-normal">#</th>
                  <th className="py-2 font-normal">Spieler</th>
                  {COLUMNS.map((c) => (
                    <th key={c.key} className={`py-2 font-normal ${c.key === 'wae' ? 'w-56 px-3' : 'px-2 text-right'}`} title={c.title}>
                      <button
                        onClick={() => setSort(c.key)}
                        className={`inline-flex items-center gap-1 hover:text-ink ${sort === c.key ? 'text-purple-200' : ''}`}
                        aria-sort={sort === c.key ? 'descending' : undefined}
                      >
                        {c.label}
                        {sort === c.key && <ArrowDown size={12} />}
                      </button>
                    </th>
                  ))}
                  <th className="px-2 py-2 font-normal">Form</th>
                  <th className="px-2 py-2 font-normal">Lieblingsfraktion</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => (
                  <tr key={s.player} className="border-b border-line/50 last:border-0">
                    <td className="py-3 font-display text-ink-3 tabular">{rank(s, i)}</td>
                    <td className="py-3">
                      <span className="flex items-center gap-2">
                        <PlayerName player={s.player} className="font-semibold" />
                        {s.games < MIN_PLAYER_GAMES && <FewData />}
                      </span>
                    </td>
                    <td className="px-2 text-right tabular">{s.games}</td>
                    <td className="px-2 text-right tabular">{s.wins}</td>
                    <td className="px-2 text-right tabular">
                      {fmtPct(s.winRate)}
                      <div className="text-xs text-ink-3">erw. {fmtPct0(s.expectedRate)}</div>
                    </td>
                    <td className="px-3">
                      <div className="flex items-center gap-3">
                        <DivergingBar value={s.wae} max={maxWae} />
                        <span className={`w-12 text-right font-semibold tabular ${s.wae >= 0 ? 'text-better' : 'text-worse'}`}>{fmtSigned(s.wae)}</span>
                      </div>
                    </td>
                    <td className="px-2 text-right tabular">{fmtPct0(s.avgVpShare)}</td>
                    <td className="px-2">
                      <Form s={s} onOpenGame={onOpenGame} />
                    </td>
                    <td className="px-2">
                      {s.favoriteFaction && (
                        <span className="inline-flex items-center gap-1.5 text-ink-2">
                          <FactionIcon id={s.favoriteFaction.faction} size={20} />
                          {s.favoriteFaction.faction}
                          <span className="text-xs text-ink-3">×{s.favoriteFaction.games}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  )
}

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div>
      <dt className="text-ink-3">{label}</dt>
      <dd className="font-medium text-ink tabular">{value}</dd>
      {sub && <dd className="text-[10px] text-ink-3">{sub}</dd>}
    </div>
  )
}

function Form({ s, onOpenGame }: { s: PlayerStat; onOpenGame: (id: string) => void }) {
  return (
    <span className="inline-flex items-center md:gap-1" aria-label="Letzte fünf Spiele">
      {s.form.map((f) => (
        <button key={f.gameId} onClick={() => onOpenGame(f.gameId)} className="rounded-full p-2 hover:bg-white/10 md:p-0.5">
          <ResultDot won={f.won} title={f.won ? 'Sieg' : 'Niederlage'} />
        </button>
      ))}
    </span>
  )
}

function Extras({ s, onOpenGame }: { s: PlayerStat; onOpenGame: (id: string) => void }) {
  return (
    <div className="mt-2.5 flex items-center justify-between gap-2 pl-7 text-xs text-ink-3">
      <span className="inline-flex items-center gap-1.5">
        Form <Form s={s} onOpenGame={onOpenGame} />
      </span>
      {s.favoriteFaction && (
        <span className="inline-flex items-center gap-1 truncate">
          <FactionIcon id={s.favoriteFaction.faction} size={16} />
          {s.favoriteFaction.faction} ×{s.favoriteFaction.games}
        </span>
      )}
    </div>
  )
}

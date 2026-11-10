import { useMemo, useState } from 'react'
import { Trophy } from 'lucide-react'
import { faction } from '../data'
import type { Row } from '../lib/filters'
import { fmtDate, fmtPct, fmtPct0, fmtSigned } from '../lib/format'
import { factionStats, MIN_GROUP_GAMES, type GroupStat } from '../lib/stats'
import { Card, Empty, FactionIcon, FewData, Modal, ModalHeader, PlayerName, RateBar, Segmented } from './ui'

type SortKey = 'wae' | 'winRate' | 'games'

export function FactionChart({ rows, onOpenGame }: { rows: Row[]; onOpenGame: (id: string) => void }) {
  const [sort, setSort] = useState<SortKey>('wae')
  const [selected, setSelected] = useState<string | null>(null)
  const stats = useMemo(() => factionStats(rows), [rows])
  const sorted = useMemo(
    () =>
      [...stats].sort((a, b) => {
        const few = Number(a.games < MIN_GROUP_GAMES) - Number(b.games < MIN_GROUP_GAMES)
        if (sort !== 'games' && few !== 0) return few // small samples go to the bottom
        return b[sort] - a[sort] || b.games - a.games
      }),
    [stats, sort],
  )

  return (
    <Card
      id="fraktionen"
      title="Fraktionen"
      subtitle={<>Balken = Win-Rate, Strich = Erwartung bei gleichen Chancen. Fraktionen mit weniger als {MIN_GROUP_GAMES} Spielen sind abgeblendet.</>}
      actions={
        <Segmented
          label="Sortierung"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'wae', label: 'Leistung' },
            { value: 'winRate', label: 'Win-Rate' },
            { value: 'games', label: 'Häufigkeit' },
          ]}
        />
      }
      className="lg:col-span-2"
    >
      {sorted.length === 0 ? (
        <Empty />
      ) : (
        <ul className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
          {sorted.map((s) => (
            <li key={s.key}>
              <button onClick={() => setSelected(s.key)} className="group w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/5">
                <div className="flex items-center gap-2 text-sm">
                  <FactionIcon id={s.key} size={22} />
                  <span className="truncate font-medium text-ink group-hover:text-white">{s.key}</span>
                  {s.games < MIN_GROUP_GAMES && <FewData />}
                  <span className="ml-auto shrink-0 text-xs text-ink-3 tabular">
                    {s.wins}/{s.games}
                  </span>
                  <span className={`w-11 shrink-0 text-right text-xs font-semibold tabular ${s.wae >= 0 ? 'text-better' : 'text-worse'}`}>
                    {fmtSigned(s.wae)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 pl-[30px]">
                  <RateBar value={s.winRate} expected={s.expectedRate} dim={s.games < MIN_GROUP_GAMES} />
                  <span className="w-10 shrink-0 text-right text-xs text-ink-2 tabular">{fmtPct0(s.winRate)}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      <FactionDetails stat={stats.find((s) => s.key === selected) ?? null} rows={rows} onClose={() => setSelected(null)} onOpenGame={onOpenGame} />
    </Card>
  )
}

function FactionDetails({
  stat,
  rows,
  onClose,
  onOpenGame,
}: {
  stat: GroupStat | null
  rows: Row[]
  onClose: () => void
  onOpenGame: (id: string) => void
}) {
  const list = stat ? rows.filter((r) => r.result.faction === stat.key).reverse() : []
  const f = stat ? faction(stat.key) : null
  return (
    <Modal open={!!stat} onClose={onClose} labelledBy="faction-title">
      {stat && f && (
        <>
          <ModalHeader id="faction-title" onClose={onClose}>
            <div className="flex items-center gap-3">
              <FactionIcon id={f.id} size={40} />
              <div>
                <h3 className="font-display text-lg text-ink">{f.name}</h3>
                <p className="text-sm text-ink-3">
                  {stat.wins} von {stat.games} gewonnen · {fmtPct(stat.winRate)} (erwartet {fmtPct0(stat.expectedRate)}) ·{' '}
                  <span className={stat.wae >= 0 ? 'text-better' : 'text-worse'}>{fmtSigned(stat.wae)}</span>
                </p>
              </div>
            </div>
          </ModalHeader>
          <ul className="scrollbar-thin divide-y divide-line/50 overflow-y-auto overscroll-contain px-4 py-2">
            {list.map(({ game, result }) => (
              <li key={`${game.id}-${result.player}`}>
                <button
                  onClick={() => {
                    onClose()
                    onOpenGame(game.id)
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-left text-sm hover:bg-white/5"
                >
                  <span className="w-5 shrink-0">{result.winner && <Trophy size={16} className="text-gold" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-ink">{game.name}</span>
                    <span className="block text-xs text-ink-3">
                      {fmtDate(game.end)} · {game.nPlayers} Spieler
                      {!result.winner && <> · Sieger: {game.winner}</>}
                    </span>
                  </span>
                  <PlayerName player={result.player} className="shrink-0 text-ink-2" />
                  <span className="w-12 shrink-0 text-right text-ink tabular">
                    {result.vp}/{game.maxVp}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  )
}

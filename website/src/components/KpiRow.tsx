import { CalendarClock, Hash, Hourglass, Trophy } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Scope } from '../lib/filters'
import { fmtDate, fmtNum } from '../lib/format'
import { mean } from '../lib/stats'
import { FactionIcon, PlayerName } from './ui'

function Kpi({ icon, label, value, detail, onClick }: { icon: ReactNode; label: string; value: ReactNode; detail?: ReactNode; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`rounded-2xl border border-line bg-panel/90 p-4 text-left ${onClick ? 'transition-colors hover:border-purple-400/60' : ''}`}
    >
      <div className="flex items-center gap-2 text-xs text-ink-3">
        <span className="text-purple-300">{icon}</span>
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-semibold text-ink tabular">{value}</div>
      {detail && <div className="mt-0.5 truncate text-xs text-ink-3">{detail}</div>}
    </Tag>
  )
}

export function KpiRow({ scope, onOpenGame }: { scope: Scope; onOpenGame: (id: string) => void }) {
  const { games } = scope
  const last = games.at(-1)
  const winner = last?.results.find((r) => r.winner)

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi icon={<Hash size={14} />} label="Spiele" value={games.length} detail={`${scope.rows.length} Ergebnisse`} />
      <Kpi icon={<CalendarClock size={14} />} label="Ø Runden" value={fmtNum(mean(games.map((g) => g.rounds)))} detail="pro Spiel" />
      <Kpi icon={<Hourglass size={14} />} label="Ø Dauer" value={`${Math.round(mean(games.map((g) => g.days)))} Tage`} detail="online, Start bis Ende" />
      <Kpi
        icon={<Trophy size={14} />}
        label="Letztes Spiel"
        onClick={last ? () => onOpenGame(last.id) : undefined}
        value={
          winner ? (
            <span className="flex items-center gap-2 text-xl">
              <PlayerName player={winner.player} />
              <FactionIcon id={winner.faction} size={22} />
            </span>
          ) : (
            '–'
          )
        }
        detail={last ? `${last.name} · ${fmtDate(last.end)}` : undefined}
      />
    </div>
  )
}

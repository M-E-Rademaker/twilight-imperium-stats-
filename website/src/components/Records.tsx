import { useMemo, type ReactNode } from 'react'
import { Crosshair, Flame, Hourglass, Rabbit, Repeat, Snowflake, Swords, Target } from 'lucide-react'
import type { Scope } from '../lib/filters'
import { fmtDate, plural } from '../lib/format'
import { records, type GameRecord } from '../lib/stats'
import { Card, Empty, PlayerName } from './ui'

function Item({ icon, title, value, detail, onClick }: { icon: ReactNode; title: string; value: ReactNode; detail?: ReactNode; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <li>
      <Tag
        onClick={onClick}
        className={`flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left ${onClick ? 'hover:bg-white/5' : ''}`}
      >
        <span className="mt-0.5 rounded-lg bg-purple-500/15 p-1.5 text-purple-300">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-ink-3">{title}</span>
          <span className="block font-medium text-ink">{value}</span>
          {detail && <span className="block truncate text-xs text-ink-3">{detail}</span>}
        </span>
      </Tag>
    </li>
  )
}

const gameDetail = (r: GameRecord) => `${r.game.name} · ${fmtDate(r.game.end)}${r.ties > 1 ? ` · ${r.ties}× erreicht` : ''}`

export function Records({ scope, onOpenGame }: { scope: Scope; onOpenGame: (id: string) => void }) {
  const r = useMemo(() => records(scope.games, scope.rows), [scope])
  if (!scope.games.length) {
    return (
      <Card title="Rekorde">
        <Empty />
      </Card>
    )
  }

  return (
    <Card id="rekorde" title="Rekorde" subtitle="Für die aktuelle Auswahl. Klick öffnet das Spiel.">
      <ul className="-mx-2 divide-y divide-line/50">
        {r.winStreak && (
          <Item
            icon={<Flame size={16} />}
            title="Längste Siegesserie"
            value={
              <>
                <PlayerName player={r.winStreak.player} /> · {plural(r.winStreak.length, 'Sieg', 'Siege')} in Folge
              </>
            }
            detail={r.winStreak.ongoing ? 'läuft noch' : undefined}
          />
        )}
        {r.lossStreak && (
          <Item
            icon={<Snowflake size={16} />}
            title="Längste Durststrecke"
            value={
              <>
                <PlayerName player={r.lossStreak.player} /> · {plural(r.lossStreak.length, 'Spiel', 'Spiele')} ohne Sieg
              </>
            }
            detail={r.lossStreak.ongoing ? 'läuft noch' : undefined}
          />
        )}
        {r.biggestWin && (
          <Item
            icon={<Swords size={16} />}
            title="Deutlichster Sieg"
            value={
              <>
                <PlayerName player={r.biggestWin.game.winner} /> mit {plural(r.biggestWin.value, 'Punkt', 'Punkten')} Vorsprung
              </>
            }
            detail={gameDetail(r.biggestWin)}
            onClick={() => onOpenGame(r.biggestWin!.game.id)}
          />
        )}
        {r.closest && (
          <Item
            icon={<Crosshair size={16} />}
            title="Knappste Entscheidung"
            value={`${plural(r.closest.value, 'Punkt', 'Punkte')} Abstand`}
            detail={gameDetail(r.closest)}
            onClick={() => onOpenGame(r.closest!.game.id)}
          />
        )}
        {r.nearMiss && (
          <Item
            icon={<Target size={16} />}
            title="Einen Punkt vor dem Sieg gescheitert"
            value={
              <>
                <PlayerName player={r.nearMiss.player} /> · {r.nearMiss.count}×
              </>
            }
            detail={`${r.nearMiss.total}× insgesamt in der Auswahl`}
          />
        )}
        {r.quickest && (
          <Item
            icon={<Rabbit size={16} />}
            title="Schnellstes Spiel"
            value={plural(r.quickest.value, 'Tag', 'Tage')}
            detail={gameDetail(r.quickest)}
            onClick={() => onOpenGame(r.quickest!.game.id)}
          />
        )}
        {r.longest && (
          <Item
            icon={<Hourglass size={16} />}
            title="Längstes Spiel"
            value={plural(r.longest.value, 'Tag', 'Tage')}
            detail={gameDetail(r.longest)}
            onClick={() => onOpenGame(r.longest!.game.id)}
          />
        )}
        {r.mostRounds && (
          <Item
            icon={<Repeat size={16} />}
            title="Meiste Runden"
            value={plural(r.mostRounds.value, 'Runde', 'Runden')}
            detail={gameDetail(r.mostRounds)}
            onClick={() => onOpenGame(r.mostRounds!.game.id)}
          />
        )}
      </ul>
    </Card>
  )
}

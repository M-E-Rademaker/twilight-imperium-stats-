import { useMemo } from 'react'
import { WIN_CATEGORIES, type WinCategory } from '../data/types'
import type { Row } from '../lib/filters'
import { fmtPct0 } from '../lib/format'
import { winTypes, type WinTypeStat } from '../lib/stats'
import { Card, Empty, PlayerName } from './ui'

const COLORS: Record<WinCategory, string> = {
  Statusphase: 'var(--color-cat-1)',
  Aktionsphase: 'var(--color-cat-2)',
  Agendaphase: 'var(--color-cat-3)',
}

function Stack({ s }: { s: WinTypeStat }) {
  return (
    <div className="flex h-3.5 w-full gap-0.5 overflow-hidden rounded-full bg-white/5">
      {WIN_CATEGORIES.map((c) =>
        s.byCategory[c] > 0 ? (
          <div
            key={c}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(s.byCategory[c] / s.total) * 100}%`, backgroundColor: COLORS[c] }}
            title={`${c}: ${s.byCategory[c]} (${fmtPct0(s.byCategory[c] / s.total)})`}
          />
        ) : null,
      )}
    </div>
  )
}

export function WinTypes({ rows }: { rows: Row[] }) {
  const { overall, players } = useMemo(() => winTypes(rows), [rows])

  return (
    <Card id="siegarten" title="Wie wird gewonnen?" subtitle="In welcher Phase fiel der Sieg, und brauchte der Sieger Punkte jenseits der Ziele (z. B. Support for the Throne)?">
      {overall.total === 0 ? (
        <Empty>Keine Siege in der Auswahl.</Empty>
      ) : (
        <>
          <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
            {WIN_CATEGORIES.map((c) => (
              <li key={c} className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ backgroundColor: COLORS[c] }} />
                {c}
                <span className="text-ink tabular">
                  {overall.byCategory[c]} · {fmtPct0(overall.byCategory[c] / overall.total)}
                </span>
              </li>
            ))}
          </ul>
          <Stack s={overall} />
          <p className="mt-3 text-sm text-ink-2">
            <span className="font-semibold text-ink tabular">{fmtPct0(overall.withSupport / overall.total)}</span> der Siege (
            {overall.withSupport} von {overall.total}) gelangen nur mit Punkten aus Support / Agenden / Relikten.
          </p>
          {players.length > 1 && (
            <ul className="mt-4 space-y-2.5 border-t border-line pt-4">
              {players.map((s) => (
                <li key={s.key} className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-2 text-sm">
                  <PlayerName player={s.key} className="truncate text-ink-2" />
                  <Stack s={s} />
                  <span className="text-right text-xs text-ink-3 tabular">{s.total} Siege</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  )
}

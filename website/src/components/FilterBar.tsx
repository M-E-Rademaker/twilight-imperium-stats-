import { useState, type ReactNode } from 'react'
import { ChevronDown, RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { dataset, playedFactions, playerCounts, vpTargets, years } from '../data'
import { activeFilterCount, EMPTY_FILTERS, toggle, type Filters } from '../lib/filters'
import { playerColor } from '../lib/players'
import { Chip, FactionIcon } from './ui'

interface Props {
  filters: Filters
  setFilters: (f: Filters | ((f: Filters) => Filters)) => void
  shown: number
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-xs font-semibold tracking-wider text-purple-200 uppercase">
        {title}
        {hint && <span className="ml-2 font-normal tracking-normal text-ink-3 normal-case">{hint}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}

export function FilterBar({ filters, setFilters, shown }: Props) {
  const [open, setOpen] = useState(false)
  const active = activeFilterCount(filters)
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((f) => ({ ...f, [key]: value }))

  const summary: { label: ReactNode; clear: () => void }[] = [
    ...filters.players.map((p) => ({ label: <>Fokus: {p}</>, clear: () => set('players', toggle(filters.players, p)) })),
    ...(filters.table.length
      ? [{ label: <>{filters.exact ? 'Genau' : 'Mit'}: {filters.table.join(' + ')}</>, clear: () => setFilters((f) => ({ ...f, table: [], exact: false })) }]
      : []),
    ...filters.factions.map((id) => ({
      label: (
        <>
          <FactionIcon id={id} size={14} /> {id}
        </>
      ),
      clear: () => set('factions', toggle(filters.factions, id)),
    })),
    ...filters.counts.map((n) => ({ label: <>{n} Spieler</>, clear: () => set('counts', toggle(filters.counts, n)) })),
    ...filters.vp.map((v) => ({ label: <>{v} VP</>, clear: () => set('vp', toggle(filters.vp, v)) })),
    ...filters.years.map((y) => ({ label: <>{y}</>, clear: () => set('years', toggle(filters.years, y)) })),
  ]

  return (
    <div className="sticky top-0 z-30 -mx-4 border-b border-line bg-space/85 px-4 py-2.5 backdrop-blur-md sm:mx-0 sm:rounded-b-2xl sm:border-x">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="filter-panel"
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-purple-400/50 bg-purple-500/15 px-3 text-sm font-medium text-purple-100 hover:bg-purple-500/25"
        >
          <SlidersHorizontal size={16} />
          Filter
          {active > 0 && <span className="rounded-full bg-purple-500 px-1.5 text-xs text-white tabular">{active}</span>}
          <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        <div className="scrollbar-thin flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-0.5">
          {summary.length === 0 ? (
            <span className="self-center text-sm whitespace-nowrap text-ink-3">Alle Spiele</span>
          ) : (
            summary.map((s, i) => (
              <button
                key={i}
                onClick={s.clear}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-purple-500/20 py-1 pr-1.5 pl-2.5 text-xs whitespace-nowrap text-purple-100 hover:bg-purple-500/30"
                aria-label="Filter entfernen"
              >
                {s.label}
                <X size={12} className="opacity-70" />
              </button>
            ))
          )}
        </div>

        <span className="hidden shrink-0 text-xs text-ink-3 tabular sm:inline">
          {shown} / {dataset.games.length} Spiele
        </span>
        {active > 0 && (
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="shrink-0 rounded-lg p-2 text-ink-3 hover:bg-white/5 hover:text-ink"
            aria-label="Alle Filter zurücksetzen"
            title="Alle Filter zurücksetzen"
          >
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      {open && (
        <div id="filter-panel" className="scrollbar-thin mt-3 max-h-[70dvh] overflow-y-auto pb-2">
          <div className="grid gap-5 md:grid-cols-2">
            <Group title="Fokus auf Spieler" hint="nur deren Ergebnisse zählen">
              {dataset.players.map((p) => (
                <Chip key={p} active={filters.players.includes(p)} color={playerColor(p)} onClick={() => set('players', toggle(filters.players, p))}>
                  {p}
                </Chip>
              ))}
            </Group>

            <Group title="Am Tisch" hint="Spiele, in denen alle gewählten dabei waren">
              {dataset.players.map((p) => (
                <Chip key={p} active={filters.table.includes(p)} color={playerColor(p)} onClick={() => set('table', toggle(filters.table, p))}>
                  {p}
                </Chip>
              ))}
              <label className={`inline-flex min-h-9 items-center gap-2 px-1 text-sm ${filters.table.length ? 'text-ink-2' : 'text-ink-3/50'}`}>
                <input
                  type="checkbox"
                  className="size-4 accent-purple-500"
                  disabled={!filters.table.length}
                  checked={filters.exact}
                  onChange={(e) => set('exact', e.target.checked)}
                />
                genau diese Besetzung
              </label>
            </Group>

            <Group title="Spieleranzahl">
              {playerCounts.map((n) => (
                <Chip key={n} active={filters.counts.includes(n)} onClick={() => set('counts', toggle(filters.counts, n))}>
                  {n} Spieler
                </Chip>
              ))}
            </Group>

            <div className="grid grid-cols-2 gap-5">
              <Group title="Siegpunkte">
                {vpTargets.map((v) => (
                  <Chip key={v} active={filters.vp.includes(v)} onClick={() => set('vp', toggle(filters.vp, v))}>
                    {v} VP
                  </Chip>
                ))}
              </Group>
              <Group title="Jahr">
                {years.map((y) => (
                  <Chip key={y} active={filters.years.includes(y)} onClick={() => set('years', toggle(filters.years, y))}>
                    {y}
                  </Chip>
                ))}
              </Group>
            </div>

            <div className="md:col-span-2">
              <Group title="Fraktion" hint="nur Ergebnisse mit dieser Fraktion zählen">
                {playedFactions.map((id) => (
                  <Chip key={id} active={filters.factions.includes(id)} onClick={() => set('factions', toggle(filters.factions, id))} title={dataset.factions[id]?.name}>
                    <FactionIcon id={id} size={18} />
                    {id}
                  </Chip>
                ))}
              </Group>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => setOpen(false)} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500">
              Fertig · {shown} Spiele
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

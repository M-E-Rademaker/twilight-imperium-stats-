import { useMemo } from 'react'
import { dataset, gamesById } from './data'
import { buildScope } from './lib/filters'
import { fmtDate } from './lib/format'
import { useUrlState } from './hooks/useUrlState'
import { Header } from './components/Header'
import { FilterBar } from './components/FilterBar'
import { KpiRow } from './components/KpiRow'
import { Leaderboard } from './components/Leaderboard'
import { WinRateChart } from './components/WinRateChart'
import { Records } from './components/Records'
import { FactionChart } from './components/FactionChart'
import { HeadToHead } from './components/HeadToHead'
import { ActivityTimeline } from './components/ActivityTimeline'
import { WinTypes } from './components/WinTypes'
import { SeatChart } from './components/SeatChart'
import { RoundsChart } from './components/RoundsChart'
import { GamesList } from './components/GamesList'
import { GameDetails } from './components/GameDetails'

export default function App() {
  const { filters, setFilters, game, openGame, closeGame } = useUrlState()
  const scope = useMemo(() => buildScope(dataset.games, filters), [filters])
  const openedGame = game ? (gamesById.get(game) ?? null) : null
  // prev/next walks the current selection, or all games if the opened one is outside it
  const sequence = openedGame && !scope.games.includes(openedGame) ? dataset.games : scope.games

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <Header />
      <FilterBar filters={filters} setFilters={setFilters} shown={scope.games.length} />

      <main className="mt-5 space-y-5">
        <KpiRow scope={scope} onOpenGame={openGame} />
        <Leaderboard rows={scope.rows} onOpenGame={openGame} />

        <div className="grid gap-5 lg:grid-cols-3">
          <WinRateChart rows={scope.rows} />
          <Records scope={scope} onOpenGame={openGame} />

          <FactionChart rows={scope.rows} onOpenGame={openGame} />
          <HeadToHead games={scope.games} />

          <ActivityTimeline rows={scope.rows} onOpenGame={openGame} />

          <WinTypes rows={scope.rows} />
          <SeatChart rows={scope.rows} />
          <RoundsChart games={scope.games} />

          <GamesList games={scope.games} onOpenGame={openGame} />
        </div>
      </main>

      <footer className="mt-12 text-center text-xs text-ink-3">
        {dataset.games.length} Spiele · {dataset.players.length} Spieler · {Object.keys(dataset.factions).length} Fraktionen · Stand{' '}
        {fmtDate(dataset.builtAt.slice(0, 10))}
      </footer>

      <GameDetails game={openedGame} sequence={sequence} onNavigate={openGame} onClose={closeGame} />
    </div>
  )
}
